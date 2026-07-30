import { Heart } from "lucide-react";

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
    <div className={`glass-ambient group relative inline-flex items-center rounded-full ${className}`}>
      <a
        href="/donate"
        className="relative isolate block rounded-full bg-ink transition-all duration-200 hover:bg-ink/85 group-hover:-translate-y-0.5"
      >
        <span className={`glass-pill-text flex items-center gap-2 ${sizing} font-display italic font-semibold text-white`}>
          <Heart size={size === "sm" ? 16 : 18} strokeWidth={2.5} fill="currentColor" />
          Donate Now
        </span>
      </a>
    </div>
  );
}
