import { useState, ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export function CompactRotatingBox<T>({
  items,
  renderItem,
  keyFor,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyFor: (item: T) => string;
}) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visible = expanded ? items : [items[index % items.length], items[(index + 1) % items.length]].filter(
    (_, i) => i === 0 || items.length > 1,
  );

  function up() {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }
  function down() {
    setIndex((i) => (i + 1) % items.length);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className={expanded ? "space-y-2 max-h-96 overflow-y-auto pr-1" : "space-y-2"}>
        {visible.map((item) => (
          <div key={keyFor(item)}>{renderItem(item)}</div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        {!expanded && items.length > 2 ? (
          <div className="flex items-center gap-1.5">
            <button onClick={up} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-background" aria-label="Previous">
              <ChevronUp size={14} />
            </button>
            <button onClick={down} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-background" aria-label="Next">
              <ChevronDown size={14} />
            </button>
            <span className="text-xs text-muted ml-1">{items.length} total</span>
          </div>
        ) : (
          <span className="text-xs text-muted">{items.length} total</span>
        )}

        {items.length > 2 && (
          <button onClick={() => setExpanded((e) => !e)} className="text-xs font-semibold text-primary">
            {expanded ? "Show less" : "View All"}
          </button>
        )}
      </div>
    </div>
  );
}
