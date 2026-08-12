import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import convertHeic from "heic-convert";

const PUBLIC_UPLOAD_DIR = path.resolve(import.meta.dirname, "..", "..", "uploads");
// Kept outside the publicly-static-served uploads/ directory on purpose —
// donation receipts contain donors' financial/contact info and should only
// ever be reachable through the authenticated /api/receipts/:filename route
// (see routes.ts), never by guessing/sharing a plain URL.
const PRIVATE_UPLOAD_DIR = path.resolve(import.meta.dirname, "..", "..", "private-uploads", "receipts");
fs.mkdirSync(PUBLIC_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });

function makeStorage(dir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = crypto.randomBytes(16).toString("hex");
      cb(null, `${name}${ext}`);
    },
  });
}

function imageFileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error("Only image files are allowed (jpg, png, webp, gif, heic)"));
  }
  cb(null, true);
}

// Public images: case photos, gallery photos, avatars, success story photos.
// Meant to be viewed by anyone, so these stay under /uploads (served
// statically — see server/index.ts).
//
// The client compresses images before upload now (see
// client/src/lib/compress-image.ts), so this limit is a safety net rather
// than the primary defense — mainly there for HEIC/HEIF files, which
// can't be resized in-browser (no non-Safari browser can decode them into
// a <canvas>) and so arrive at whatever size the phone camera produced.
export const uploadImage = multer({
  storage: makeStorage(PUBLIC_UPLOAD_DIR),
  fileFilter: imageFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Donation receipts: private. Written to a directory that's never served
// statically — the only way to read one back is GET /api/receipts/:filename,
// which checks the requester is the donor or an admin first.
export const uploadReceipt = multer({
  storage: makeStorage(PRIVATE_UPLOAD_DIR),
  fileFilter: imageFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export function uploadedFileUrl(filename: string) {
  return `/uploads/${filename}`;
}

export function receiptUrl(filename: string) {
  return `/api/receipts/${filename}`;
}

export function receiptFilePath(filename: string) {
  // path.basename strips any directory separators — guards against path
  // traversal via a crafted filename, since this is echoed back from a URL
  // param the client controls.
  const safe = path.basename(filename);
  return path.join(PRIVATE_UPLOAD_DIR, safe);
}

// ─── Content-based image validation ────────────────────────────────────
// The extension/mimetype filter above only checks what the uploader
// *claims* the file is — trivial to fake by renaming any file to .jpg.
// This checks the actual file bytes match a real image format, and deletes
// anything that doesn't before the request can proceed.

function looksLikeImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const bytes = Array.from(buffer.subarray(0, 12));

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  const isWebp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  return isJpeg || isPng || isGif || isWebp;
}

// HEIC/HEIF files (the default photo format on iPhones) start with an ISO
// base media "ftyp" box: 4 bytes of box size, then the literal ASCII bytes
// "ftyp", then a 4-byte brand like "heic", "heix", "mif1", "heim", "heis".
// Browsers other than Safari can't render these at all, so anything that
// looks like HEIC gets converted to JPEG below before it's ever stored.
function looksLikeHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const ftyp = buffer.subarray(4, 8).toString("ascii");
  if (ftyp !== "ftyp") return false;
  const brand = buffer.subarray(8, 12).toString("ascii");
  return ["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"].includes(brand);
}

// Reads a HEIC/HEIF file from disk, converts it to JPEG, writes the result
// next to it with a .jpg extension, and removes the original. Mutates the
// multer File object in place so every downstream consumer (verifyIsRealImage,
// the route handlers building DB URLs from file.filename) transparently sees
// the converted JPEG instead of the original HEIC.
async function convertHeicFileToJpeg(file: Express.Multer.File): Promise<void> {
  const inputBuffer = fs.readFileSync(file.path);
  const outputBuffer = (await convertHeic({ buffer: inputBuffer, format: "JPEG", quality: 0.9 })) as Buffer;

  const dir = path.dirname(file.path);
  const baseName = path.basename(file.filename, path.extname(file.filename));
  const newFilename = `${baseName}.jpg`;
  const newPath = path.join(dir, newFilename);

  fs.writeFileSync(newPath, outputBuffer);
  fs.unlinkSync(file.path);

  file.filename = newFilename;
  file.path = newPath;
  file.mimetype = "image/jpeg";
}

export async function verifyIsRealImage(req: any, res: any, next: any) {
  const files: Express.Multer.File[] = req.files
    ? Array.isArray(req.files)
      ? req.files
      : (Object.values(req.files) as Express.Multer.File[][]).flat()
    : req.file
    ? [req.file]
    : [];

  if (files.length === 0) return next();

  try {
    for (const file of files) {
      const fd = fs.openSync(file.path, "r");
      const buffer = Buffer.alloc(12);
      fs.readSync(fd, buffer, 0, 12, 0);
      fs.closeSync(fd);

      if (looksLikeHeic(buffer)) {
        await convertHeicFileToJpeg(file);
      }
    }
  } catch {
    for (const f of files) fs.unlink(f.path, () => {});
    return res.status(400).json({ message: "That HEIC photo couldn't be converted. Please try a different photo, or take a screenshot and upload that instead." });
  }

  for (const file of files) {
    let ok = false;
    try {
      const fd = fs.openSync(file.path, "r");
      const buffer = Buffer.alloc(12);
      fs.readSync(fd, buffer, 0, 12, 0);
      fs.closeSync(fd);
      ok = looksLikeImage(buffer);
    } catch {
      ok = false;
    }
    if (!ok) {
      for (const f of files) fs.unlink(f.path, () => {});
      return res.status(400).json({ message: "That file doesn't look like a valid image. Please upload a real photo or screenshot." });
    }
  }
  next();
}
