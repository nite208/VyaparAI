import { neon } from "@neondatabase/serverless";
import { useSettings } from "./settings";
import type { UploadedFile, Insight, ChatMessage, Report } from "./store";

export function getSql() {
  const conn = useSettings.getState().neonConnectionString;
  if (!conn) return null;
  try {
    return neon(conn);
  } catch {
    return null;
  }
}

export async function testNeonConnection(conn: string): Promise<{ ok: boolean; message: string }> {
  try {
    const sql = neon(conn);
    const r = (await sql`SELECT 1 as ok`) as Array<{ ok: number }>;
    return { ok: r[0]?.ok === 1, message: "Connected" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

let schemaReady = false;

export async function initSchema(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  if (schemaReady) return true;
  try {
    await sql`CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size BIGINT NOT NULL,
      cloudinary_url TEXT,
      row_count INT,
      column_names JSONB,
      status TEXT NOT NULL DEFAULT 'analyzed',
      source TEXT,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      file_id TEXT,
      file_name TEXT,
      content TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      file_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      file_id TEXT,
      file_name TEXT,
      title TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS stats (
      key TEXT PRIMARY KEY,
      value INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    schemaReady = true;
    return true;
  } catch (e) {
    console.warn("[neon] initSchema failed", e);
    return false;
  }
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.warn("[neon] op failed", e);
    return null;
  }
}

export async function dbAddFile(f: UploadedFile, cloudinaryUrl?: string | null) {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) await initSchema();
  await safe(() =>
    sql`INSERT INTO files (id,name,type,size,cloudinary_url,row_count,column_names,status,source,uploaded_at)
        VALUES (${f.id}, ${f.name}, ${f.type}, ${f.size}, ${cloudinaryUrl ?? null},
                ${f.rowCount ?? null}, ${JSON.stringify(f.columnNames ?? [])},
                ${f.status}, ${f.source ?? "upload"}, to_timestamp(${f.uploadedAt / 1000}))
        ON CONFLICT (id) DO NOTHING`,
  );
}

export async function dbDeleteFile(id: string) {
  const sql = getSql();
  if (!sql) return;
  await safe(() => sql`DELETE FROM files WHERE id = ${id}`);
  await safe(() => sql`DELETE FROM insights WHERE file_id = ${id}`);
  await safe(() => sql`DELETE FROM messages WHERE file_id = ${id}`);
  await safe(() => sql`DELETE FROM reports WHERE file_id = ${id}`);
}

export async function dbAddInsight(i: Insight) {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) await initSchema();
  await safe(() =>
    sql`INSERT INTO insights (id,file_id,file_name,content,created_at)
        VALUES (${i.id}, ${i.fileId}, ${i.fileName}, ${i.content}, to_timestamp(${i.createdAt / 1000}))
        ON CONFLICT (id) DO NOTHING`,
  );
}

export async function dbAddMessage(m: ChatMessage) {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) await initSchema();
  await safe(() =>
    sql`INSERT INTO messages (id,file_id,role,content,created_at)
        VALUES (${m.id}, ${m.fileId ?? null}, ${m.role}, ${m.content}, to_timestamp(${m.createdAt / 1000}))
        ON CONFLICT (id) DO NOTHING`,
  );
}

export async function dbAddReport(r: Report) {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) await initSchema();
  await safe(() =>
    sql`INSERT INTO reports (id,file_id,file_name,title,payload,created_at)
        VALUES (${r.id}, ${r.fileId}, ${r.fileName}, ${r.title}, ${JSON.stringify(r.payload)},
                to_timestamp(${r.createdAt / 1000}))
        ON CONFLICT (id) DO NOTHING`,
  );
}

export async function dbBumpStat(key: string, by = 1) {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) await initSchema();
  await safe(() =>
    sql`INSERT INTO stats (key,value,updated_at) VALUES (${key}, ${by}, now())
        ON CONFLICT (key) DO UPDATE SET value = stats.value + ${by}, updated_at = now()`,
  );
}

export async function dbClearAll() {
  const sql = getSql();
  if (!sql) return;
  await safe(() => sql`DELETE FROM messages`);
  await safe(() => sql`DELETE FROM insights`);
  await safe(() => sql`DELETE FROM reports`);
  await safe(() => sql`DELETE FROM files`);
  await safe(() => sql`DELETE FROM stats`);
}

export type LoadedAll = {
  files: UploadedFile[];
  insights: Insight[];
  messages: ChatMessage[];
  reports: Report[];
  stats: Record<string, number>;
};

export async function dbLoadAll(): Promise<LoadedAll | null> {
  const sql = getSql();
  if (!sql) return null;
  if (!(await initSchema())) return null;
  try {
    const [files, insights, messages, reports, stats] = (await Promise.all([
      sql`SELECT * FROM files ORDER BY uploaded_at DESC LIMIT 50`,
      sql`SELECT * FROM insights ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM messages ORDER BY created_at ASC LIMIT 500`,
      sql`SELECT * FROM reports ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM stats`,
    ])) as [
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<Record<string, unknown>>,
      Array<{ key: string; value: number }>,
    ];
    return {
      files: files.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        type: r.type as UploadedFile["type"],
        size: Number(r.size),
        uploadedAt: new Date(r.uploaded_at as string).getTime(),
        status: r.status as UploadedFile["status"],
        rowCount: r.row_count == null ? undefined : Number(r.row_count),
        columnNames: (r.column_names as string[]) || [],
        source: (r.source as UploadedFile["source"]) || "upload",
        cloudinaryUrl: (r.cloudinary_url as string) || undefined,
      })),
      insights: insights.map((r) => ({
        id: r.id as string,
        fileId: r.file_id as string,
        fileName: r.file_name as string,
        content: r.content as string,
        createdAt: new Date(r.created_at as string).getTime(),
      })),
      messages: messages.map((r) => ({
        id: r.id as string,
        fileId: (r.file_id as string) ?? null,
        role: r.role as ChatMessage["role"],
        content: r.content as string,
        createdAt: new Date(r.created_at as string).getTime(),
      })),
      reports: reports.map((r) => ({
        id: r.id as string,
        fileId: r.file_id as string,
        fileName: r.file_name as string,
        title: r.title as string,
        payload: r.payload as Report["payload"],
        createdAt: new Date(r.created_at as string).getTime(),
      })),
      stats: Object.fromEntries(stats.map((s) => [s.key, Number(s.value)])),
    };
  } catch (e) {
    console.warn("[neon] load failed", e);
    return null;
  }
}
