export function HeartHandIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* soft cloud backdrop */}
      <ellipse cx="130" cy="140" rx="110" ry="66" fill="currentColor" className="text-primary/[0.06]" />
      <circle cx="55" cy="120" r="34" fill="currentColor" className="text-primary/[0.08]" />
      <circle cx="205" cy="115" r="30" fill="currentColor" className="text-primary/[0.08]" />

      {/* small birds */}
      <path d="M40 46q6-7 12 0 6-7 12 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-primary/40" />
      <path d="M195 34q5-6 10 0 5-6 10 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-primary/40" />

      {/* hand */}
      <path
        d="M75 165c0-30 14-46 30-52 4-2 8 0 8 5v10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
      <path
        d="M75 165c-8 0-15 6-15 15 0 12 10 18 22 18h55c14 0 24-9 24-22v-28c0-6-5-10-10-10s-10 4-10 10v8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />

      {/* heart resting on the palm */}
      <path
        d="M130 108c-10-12-28-10-32 4-4 15 12 26 32 40 20-14 36-25 32-40-4-14-22-16-32-4Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-primary"
        fill="currentColor"
        fillOpacity="0.08"
      />
    </svg>
  );
}
