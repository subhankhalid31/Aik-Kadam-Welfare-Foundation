// ─────────────────────────────────────────────────────────────────────────
// A blog post's body is stored (in `blogs.content`) as a JSON-encoded array
// of small "blocks" rather than one HTML blob. That's the whole trick behind
// "add a picture in between paragraphs" — the admin editor lets you insert
// an image block at any position in the list, and the renderer just walks
// the array in order, so the image ends up exactly where it was dropped,
// both in the editor and on the published page.
// ─────────────────────────────────────────────────────────────────────────

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "image"; url: string; caption?: string };

export function serializeBlogBlocks(blocks: BlogBlock[]): string {
  return JSON.stringify(blocks);
}

// Tolerant on purpose: a post authored before this format existed (or any
// malformed row) is treated as a single legacy paragraph instead of making
// the page blow up.
export function parseBlogBlocks(content: string): BlogBlock[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed as BlogBlock[];
  } catch {
    // fall through to legacy handling below
  }
  return content.trim() ? [{ type: "paragraph", text: content }] : [];
}

// Plain-text preview used for admin list rows and as an excerpt fallback —
// strips block structure down to a single line of text.
export function blogBlocksToPlainText(blocks: BlogBlock[]): string {
  return blocks
    .map((b) => (b.type === "image" ? "" : b.text))
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function emptyParagraphBlock(): BlogBlock {
  return { type: "paragraph", text: "" };
}
