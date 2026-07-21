import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

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
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error("Only image files are allowed (jpg, png, webp, gif)"));
  }
  cb(null, true);
}

// Public images: case photos, gallery photos, avatars, success story photos.
// Meant to be viewed by anyone, so these stay under /uploads (served
// statically — see server/index.ts).
export const uploadImage = multer({
  storage: makeStorage(PUBLIC_UPLOAD_DIR),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Donation receipts: private. Written to a directory that's never served
// statically — the only way to read one back is GET /api/receipts/:filename,
// which checks the requester is the donor or an admin first.
export const uploadReceipt = multer({
  storage: makeStorage(PRIVATE_UPLOAD_DIR),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
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

export function verifyIsRealImage(req: any, res: any, next: any) {
  const files: Express.Multer.File[] = req.files
    ? Array.isArray(req.files)
      ? req.files
      : (Object.values(req.files) as Express.Multer.File[][]).flat()
    : req.file
    ? [req.file]
    : [];

  if (files.length === 0) return next();

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
