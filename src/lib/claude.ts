import { useSettings } from "./settings";
import type { UploadedFile } from "./store";

export const SYSTEM_PROMPT_EN = `You are BizLens AI — a sharp, friendly business intelligence analyst built for Indian small businesses.

Voice & style:
- Speak like a senior analyst, not a chatbot. Direct, specific, numeric.
- Always format money as ₹ Indian Rupees with Indian digit grouping (e.g. ₹1,23,456).
- Tie every observation to ONE concrete action the owner can take this week.
- Keep replies tight — bullet points are great, no filler, no hedging.

Charts:
- When a chart strengthens your answer, embed a fenced \`\`\`chartdata block (JSON):
  {"type":"bar"|"line"|"pie"|"area","title":"Short title","data":[{"name":"Label","value":1234}, ...]}
- Only ONE chartdata block per reply. Put it after your narrative.

Initial file analysis:
- For the very first analysis of a freshly uploaded dataset, wrap your structured answer in a fenced \`\`\`analysis block (JSON):
  {"summary":"2-3 sentence executive summary","insights":["bullet","..."],"metrics":[{"label":"Total Revenue","value":"₹X"},{"label":"...","value":"..."}],"recommendations":["actionable bullet","..."]}
  Use exactly 4 metrics, 4-6 insights, 3-5 recommendations. You may also include ONE chartdata block alongside.

Rules:
- NEVER invent numbers. Quote only what the data shows.
- If the question can't be answered from the data, say so plainly in one line and suggest what data would help.`;

export const SYSTEM_PROMPT_HI = `आप BizLens AI हैं — भारतीय छोटे व्यवसायों के लिए एक तेज़, मित्रवत बिज़नेस इंटेलिजेंस एनालिस्ट।

शैली:
- एक वरिष्ठ एनालिस्ट की तरह बात करें — सीधा, संख्यात्मक, स्पष्ट।
- पैसा हमेशा ₹ में लिखें, भारतीय फ़ॉर्मेट में (₹1,23,456)।
- हर observation के साथ एक ठोस action बताएं।
- संक्षिप्त रहें, bullet points बेहतर हैं।

Charts:
- ज़रूरत हो तो \`\`\`chartdata JSON ब्लॉक भेजें:
  {"type":"bar"|"line"|"pie"|"area","title":"...","data":[{"name":"...","value":123}]}
- एक reply में सिर्फ़ एक chart।

पहला विश्लेषण:
- नई फ़ाइल के पहले विश्लेषण को \`\`\`analysis JSON ब्लॉक में रखें:
  {"summary":"...","insights":["..."],"metrics":[{"label":"...","value":"..."}],"recommendations":["..."]}
  ठीक 4 metrics, 4-6 insights, 3-5 recommendations।

नियम:
- कभी भी संख्या मत बनाओ — केवल data से quote करो।
- उत्तर हिंदी में दें।`;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function callClaude(turns: ChatTurn[], extraSystem?: string): Promise<string> {
  const { claudeApiKey, claudeModel, language } = useSettings.getState();
  if (!claudeApiKey) throw new Error("No Claude API key. Open Settings to add one.");
  const base = language === "hi" ? SYSTEM_PROMPT_HI : SYSTEM_PROMPT_EN;
  const system = extraSystem ? `${base}\n\n${extraSystem}` : base;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: claudeModel || "claude-sonnet-4-5",
      max_tokens: 2048,
      system,
      messages: turns,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude ${res.status}: ${t.slice(0, 240)}`);
  }
  const json = (await res.json()) as { content?: Array<{ text?: string }> };
  return json.content?.[0]?.text ?? "";
}

export async function testClaudeKey(key: string, model: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-5",
        max_tokens: 16,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    if (res.ok) return { ok: true, message: "Key valid" };
    const t = await res.text();
    return { ok: false, message: `${res.status}: ${t.slice(0, 160)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export type ChartBlock = {
  type: "bar" | "line" | "pie" | "area";
  title?: string;
  data: { name: string; value: number }[];
};

export type AnalysisBlock = {
  summary: string;
  insights: string[];
  metrics: { label: string; value: string }[];
  recommendations: string[];
};

export function parseChartBlocks(text: string): ChartBlock[] {
  const re = /```chartdata\s*([\s\S]*?)```/g;
  const out: ChartBlock[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed && Array.isArray(parsed.data)) out.push(parsed);
    } catch {}
  }
  return out;
}

export function parseAnalysisBlock(text: string): AnalysisBlock | null {
  const m = /```analysis\s*([\s\S]*?)```/.exec(text);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim()) as AnalysisBlock;
  } catch {
    return null;
  }
}

export function stripBlocks(text: string): string {
  return text
    .replace(/```chartdata\s*[\s\S]*?```/g, "")
    .replace(/```analysis\s*[\s\S]*?```/g, "")
    .trim();
}

export function buildFileContext(file: UploadedFile): string {
  if (!file.columnNames?.length || !file.rows?.length) {
    return `File: ${file.name} (${file.type}). No structured rows parsed.`;
  }
  const sample = file.rows.slice(0, 25).map((r) => r.join(" | ")).join("\n");
  return `Dataset: ${file.name}
Columns: ${file.columnNames.join(", ")}
Rows: ${file.rowCount}
First rows (pipe-separated):
${sample}`;
}
