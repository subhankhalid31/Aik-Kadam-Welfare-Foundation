// Client-side image compression before upload. Runs entirely in the
// browser via <canvas>, so a photo straight off a phone camera (often
// 8-20MB) shrinks down before it's ever sent over the network — the
// server's own upload size limit exists as a safety net behind this, not
// as the primary defense against large files.
//
// HEIC/HEIF files can't be decoded by <canvas> in any browser except
// Safari, so those are left untouched here; the server already converts
// HEIC to JPEG after upload (see server/lib/upload.ts), and the server's
// size limit is set generously specifically to give those room through.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const SKIP_EXTENSIONS = [".heic", ".heif"];

export async function compressImage(file: File): Promise<File> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (SKIP_EXTENSIONS.includes(ext)) return file;
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;

    // Only swap in the compressed version if it's actually smaller — a
    // tiny or already-compressed source image re-encoded as JPEG can
    // occasionally end up larger, and there's no reason to use it then.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Decoding failed (corrupt file, a format this browser can't read,
    // etc.) — fall back to the original file and let the server's own
    // validation handle it rather than blocking the upload here.
    return file;
  }
}

export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
