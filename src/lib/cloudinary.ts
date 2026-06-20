import { useSettings } from "./settings";

export async function uploadToCloudinary(file: File): Promise<string | null> {
  const { cloudinaryCloudName, cloudinaryUploadPreset } = useSettings.getState();
  if (!cloudinaryCloudName || !cloudinaryUploadPreset) return null;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", cloudinaryUploadPreset);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/auto/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cloudinary ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { secure_url?: string };
  return json.secure_url ?? null;
}
