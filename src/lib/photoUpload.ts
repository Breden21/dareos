import { supabase } from "./supabaseClient";

// Shrinks a photo before it ever touches storage or the offline queue -
// a raw phone photo can be several MB, which is wasteful for Storage and
// genuinely risky for localStorage's much smaller quota when queued offline.
export async function compressImage(file: File, maxDimension = 1280, quality = 0.7): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
}

// Uploads into the uploader's own folder (required by the storage RLS
// policy) and returns the storage path - not a public URL, since the
// bucket is private. Viewing it later requires a signed URL, generated
// on demand (no viewer UI built yet - that's a natural next increment).
export async function uploadEvidencePhoto(userId: string, blob: Blob): Promise<string | null> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("evidence-photos").upload(path, blob, { contentType: "image/jpeg" });
  return error ? null : path;
}

// For the offline queue: a photo taken with no connectivity can't upload
// yet, so it's held as base64 text (localStorage only stores strings)
// until sync time.
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
