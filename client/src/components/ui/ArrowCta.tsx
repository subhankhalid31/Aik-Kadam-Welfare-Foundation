import { Link } from "wouter";
import { ArrowRight, type LucideIcon } from "lucide-react";

// Shared hover behaviour for the landing page's primary CTAs: solid green
// (or ink, for the "we've got you covered" panel which sits on a gold
// background where green would clash) fades to a warm beige on hover,
// text/icon flip to ink to match, and the arrow glyph slides out to the
// right while a second copy slides in from the left behind it — reads as
// the arrow "passing through" rather than just nudging over.
//
// `shape`, `size`, and `sheen` are all opt-in and default to the original
// large pill look, so existing callers (e.g. the yellow callout's "Submit
// Your Case" button) render pixel-identical to before, colors and hover
// behaviour included. The navbar and hero opt into `shape="rect"` +
// `size="sm"` for a compact, editorial rectangular button instead.
export function ArrowCta({
  href,
  icon: Icon,
  children,
  variant = "solid",
  shape = "pill",
  size = "md",
  sheen = false,
  sheenMode = "hover",
  animateArrow = false,
  className = "",
}: {
  href: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: "solid" | "outline" | "ink" | "ivory";
  shape?: "pill" | "rect" | "square";
  size?: "sm" | "md";
  sheen?: boolean;
  sheenMode?: "hover" | "continuous";
  animateArrow?: boolean;
  /** Appended after the base classes, so e.g. a custom `pl-*`/`pr-*` here
   *  overrides the size preset's padding (Tailwind resolves same-specificity
   *  conflicts by source order, and this always renders last). */
  className?: string;
}) {
  const styles =
    variant === "solid"
      ? "bg-brand-green text-white hover:bg-beige hover:text-ink"
      : variant === "ink"
      ? "bg-ink text-white hover:bg-beige hover:text-ink"
      : variant === "ivory"
      ? "bg-beige text-ink hover:bg-ink hover:text-white"
      : "bg-transparent text-ink border-2 border-brand-green hover:bg-beige hover:border-beige";

  const shapeClass = shape === "pill" ? "rounded-full" : shape === "square" ? "rounded-md" : "rounded-lg";
  const sizeClass = size === "sm" ? "gap-2 pl-4 pr-3.5 py-2.5 text-sm" : "gap-2.5 pl-6 pr-5 py-3.5";

  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center overflow-hidden font-semibold transition-colors duration-300 ${shapeClass} ${sizeClass} ${styles} ${sheen && sheenMode === "continuous" ? "btn-sheen" : ""} ${className}`}
    >
      {sheen && sheenMode === "hover" && (
        <span
          className="pointer-events-none absolute inset-0 -translate-x-[130%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[130%]"
          aria-hidden="true"
        />
      )}
      {Icon && <Icon size={size === "sm" ? 15 : 17} className="relative shrink-0" />}
      <span className="relative">{children}</span>
      <span className={`relative ml-1 shrink-0 ${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}`}>
        {/*<ArrowRight size={size === "sm" ? 14 : 16} className={`absolute inset-0 transition-transform duration-300 group-hover:translate-x-6 ${animateArrow ? "animate-[arrowPush_1.5s_ease-in-out_infinite]" : ""}`} />*/}
        <ArrowRight size={size === "sm" ? 14 : 16} className={`absolute inset-0 -translate-x-2 transition-transform duration-300 group-hover:translate-x-0 ${animateArrow ? "animate-[arrowPush_1.5s_ease-in-out_infinite]" : ""}`} />
      </span>
    </Link>
  );
}
