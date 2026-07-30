export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

// Frosted-glass form field: translucent white + backdrop blur instead of a
// flat white card, so every form built on this shared class (contact,
// forgot-password, post-case, account settings, etc.) picks up the site's
// glass language without each page having to hand-roll it.
export const inputClass =
  "w-full rounded-xl border border-white/70 bg-white/60 backdrop-blur-md px-4 py-2.5 text-sm text-ink placeholder:text-muted shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_1px_3px_rgba(11,31,23,0.06)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white/80 transition-all duration-200";
