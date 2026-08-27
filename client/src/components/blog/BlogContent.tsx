import { parseBlogBlocks } from "@shared/blog-blocks";

// Renders a published post's body — walks the block array in the order the
// admin arranged it, so an image dropped between two paragraphs in the
// editor shows up in that exact spot here too.
export function BlogContent({ content }: { content: string }) {
  const blocks = parseBlogBlocks(content);

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2 key={i} className="font-display text-xl sm:text-2xl text-ink pt-2">
              {block.text}
            </h2>
          );
        }
        if (block.type === "image") {
          return (
            <figure key={i}>
              <img src={block.url} alt={block.caption || ""} className="w-full rounded-2xl object-cover" />
              {block.caption && <figcaption className="mt-2 text-center text-xs text-muted">{block.caption}</figcaption>}
            </figure>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-relaxed text-ink/85 whitespace-pre-line">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
