// ─────────────────────────────────────────────────────────────────────────
// Powers the About page's slideshow (see client/src/assets/about-media/
// README.md for the drop-a-file-in convention). Vite glob-imports whatever
// photos/videos are sitting in that folder at build time — nothing here
// needs to change when someone adds or removes a file.
// ─────────────────────────────────────────────────────────────────────────

export type AboutMediaItem = { type: "image" | "video"; src: string; caption: string };

const imageModules = import.meta.glob<{ default: string }>(
  "/src/assets/about-media/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}",
  { eager: true },
);
const videoModules = import.meta.glob<{ default: string }>(
  "/src/assets/about-media/*.{mp4,webm,mov,MP4,WEBM,MOV}",
  { eager: true },
);

// "food-drives-reaching-families.jpg" -> "food drives reaching families".
// Deliberately doesn't touch capitalization — if the file is named
// "AAA.jpg" the caption is "AAA", exactly as written.
function filenameToCaption(path: string): string {
  const base = path.split("/").pop() || "";
  const withoutExt = base.replace(/\.[^./]+$/, "");
  return withoutExt.replace(/[-_]+/g, " ").trim();
}

function pathSortKey(path: string): string {
  return path.split("/").pop() || path;
}

export const ABOUT_MEDIA_ITEMS: AboutMediaItem[] = [
  ...Object.entries(imageModules).map(([path, mod]) => ({
    type: "image" as const,
    src: mod.default,
    caption: filenameToCaption(path),
    _sortKey: pathSortKey(path),
  })),
  ...Object.entries(videoModules).map(([path, mod]) => ({
    type: "video" as const,
    src: mod.default,
    caption: filenameToCaption(path),
    _sortKey: pathSortKey(path),
  })),
]
  .sort((a, b) => a._sortKey.localeCompare(b._sortKey))
  .map(({ _sortKey, ...item }) => item);
