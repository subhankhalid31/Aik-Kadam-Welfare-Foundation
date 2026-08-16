import { cn } from "@/lib/utils";

// Wraps the .glass-button-wrap / .glass-button / .glass-button-shadow markup
// (defined once in index.css, originally built for login/signup) so any page
// can drop in the same liquid-glass button instead of re-typing the three
// nested divs. Renders a <button> by default, or an <a> when href is passed.
export function GlassButton({
  children,
  type = "button",
  href,
  onClick,
  disabled,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** md = full-width auth-style button, sm = inline pill-sized CTA */
  size?: "md" | "sm";
}) {
  const textClass = cn(
    "glass-button-text relative block select-none tracking-tighter text-center font-semibold",
    size === "md" ? "w-full py-3.5" : "px-6 py-3 text-sm inline-flex items-center gap-1.5",
  );

  const buttonClass = cn(
    "glass-button relative z-10 isolate transition-all",
    size === "md" ? "w-full rounded-full" : "rounded-full",
    disabled && "opacity-70",
    className,
  );

  return (
    <div className={cn("glass-button-wrap", size === "md" && "w-full")}>
      {href ? (
        <a href={href} className={buttonClass}>
          <span className={textClass}>{children}</span>
        </a>
      ) : (
        <button type={type} disabled={disabled} onClick={onClick} className={buttonClass}>
          <span className={textClass}>{children}</span>
        </button>
      )}
      <div className="glass-button-shadow rounded-full pointer-events-none" />
    </div>
  );
}
