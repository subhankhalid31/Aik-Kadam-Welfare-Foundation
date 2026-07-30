import { Heart } from "lucide-react";

// Donate Now uses its own slightly deeper gold, kept local to this button so
// the shared `accent` yellow used elsewhere on the site is untouched.
const DONATE_GOLD = "#ffcb40";
const DONATE_GOLD_HOVER = "#E0AC2E";

export function DonateButton({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const sizing =
    size === "sm" ? "px-5 py-2 text-sm" : "px-7 py-2.5 text-base sm:text-lg";

  return (
    <a
      href="/donate"
      className={`group relative inline-flex items-center gap-2 rounded-full ${className}`}
    >
      {/* soft pulse behind the button, draws the eye without being obnoxious */}
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-25 group-hover:opacity-40 -z-10"
        style={{ backgroundColor: DONATE_GOLD }}
      />
      <span
        className={`glass-surface relative inline-flex items-center gap-2 rounded-full ${sizing} font-display italic font-semibold text-ink shadow-md transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg`}
        style={{ backgroundColor: DONATE_GOLD, boxShadow: "0 4px 14px -2px rgba(204,171,78,0.45)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = DONATE_GOLD_HOVER)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = DONATE_GOLD)}
      >
        <Heart size={size === "sm" ? 16 : 18} strokeWidth={2.5} fill="currentColor" className="text-ink/90" />
        Donate Now
      </span>
    </a>
  );
}
