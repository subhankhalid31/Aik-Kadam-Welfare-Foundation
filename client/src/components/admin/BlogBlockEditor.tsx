import { useRef, useState } from "react";
import { ImagePlus, Heading as HeadingIcon, Type, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";
import { inputClass } from "@/components/ui/FormField";
import type { BlogBlock } from "@shared/blog-blocks";

// ─────────────────────────────────────────────────────────────────────────
// The actual "insert a picture between two paragraphs" editor. `blocks` is
// an ordered list the admin builds up — a paragraph textarea, a heading
// input, or an uploaded image with an optional caption — and each one has
// insert-above/insert-below controls right next to it, so a photo can be
// dropped into the middle of a post, not just appended at the end.
// ─────────────────────────────────────────────────────────────────────────

export function BlogBlockEditor({ blocks, onChange }: { blocks: BlogBlock[]; onChange: (blocks: BlogBlock[]) => void }) {
  function updateBlock(index: number, block: BlogBlock) {
    const next = [...blocks];
    next[index] = block;
    onChange(next);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function insertAt(index: number, block: BlogBlock) {
    const next = [...blocks];
    next.splice(index, 0, block);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          Nothing here yet — add a paragraph or an image to start writing.
        </p>
      )}

      {blocks.map((block, index) => (
        <div key={index}>
          <InsertControls onInsertParagraph={() => insertAt(index, { type: "paragraph", text: "" })} onInsertImage={(url) => insertAt(index, { type: "image", url })} />
          <BlockRow
            block={block}
            onChange={(b) => updateBlock(index, b)}
            onRemove={() => removeBlock(index)}
            onMoveUp={index > 0 ? () => moveBlock(index, -1) : undefined}
            onMoveDown={index < blocks.length - 1 ? () => moveBlock(index, 1) : undefined}
          />
        </div>
      ))}

      {/* Trailing insert row — how you add the very first block, or add
          more after the last one. */}
      <InsertControls onInsertParagraph={() => insertAt(blocks.length, { type: "paragraph", text: "" })} onInsertImage={(url) => insertAt(blocks.length, { type: "image", url })} label={blocks.length === 0 ? undefined : "Add more"} />
    </div>
  );
}

function InsertControls({ onInsertParagraph, onInsertImage, label = "Insert here" }: { onInsertParagraph: () => void; onInsertImage: (url: string) => void; label?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    e.target.value = "";
    if (!raw) return;
    setError("");
    setUploading(true);
    try {
      const file = await compressImage(raw);
      const formData = new FormData();
      formData.append("image", file);
      const { url } = await api.postForm<{ url: string }>("/api/admin/blogs/upload-image", formData);
      onInsertImage(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="group flex items-center gap-2 py-1">
      <div className="h-px flex-1 bg-border/0 group-hover:bg-border transition-colors" />
      <button
        type="button"
        onClick={onInsertParagraph}
        className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:bg-background transition-colors"
      >
        <Type size={11} /> Text
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:bg-background transition-colors disabled:opacity-60"
      >
        {uploading ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />} Image
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <span className="text-[10px] uppercase tracking-wide text-muted/70">{label}</span>
      <div className="h-px flex-1 bg-border/0 group-hover:bg-border transition-colors" />
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}

function BlockRow({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: BlogBlock;
  onChange: (block: BlogBlock) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="group/block relative rounded-xl border border-border bg-white p-3.5">
      <div className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
        {onMoveUp && (
          <button type="button" onClick={onMoveUp} className="flex h-6 w-6 items-center justify-center rounded-md text-ink/50 hover:bg-background hover:text-ink" title="Move up">
            <ChevronUp size={13} />
          </button>
        )}
        {onMoveDown && (
          <button type="button" onClick={onMoveDown} className="flex h-6 w-6 items-center justify-center rounded-md text-ink/50 hover:bg-background hover:text-ink" title="Move down">
            <ChevronDown size={13} />
          </button>
        )}
        <button type="button" onClick={onRemove} className="flex h-6 w-6 items-center justify-center rounded-md text-danger/70 hover:bg-danger/10 hover:text-danger" title="Remove">
          <Trash2 size={13} />
        </button>
      </div>

      {block.type === "paragraph" && (
        <>
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted"><Type size={10} /> Paragraph</span>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={4}
            placeholder="Write a paragraph..."
            className={`${inputClass} mt-1.5 resize-y`}
          />
        </>
      )}

      {block.type === "heading" && (
        <>
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted"><HeadingIcon size={10} /> Heading</span>
          <input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Section heading"
            className={`${inputClass} mt-1.5`}
          />
        </>
      )}

      {block.type === "image" && (
        <>
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted"><ImagePlus size={10} /> Image</span>
          <img src={block.url} alt="" className="mt-1.5 max-h-64 w-full rounded-lg object-cover" />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={`${inputClass} mt-2 text-xs`}
          />
        </>
      )}
    </div>
  );
}
