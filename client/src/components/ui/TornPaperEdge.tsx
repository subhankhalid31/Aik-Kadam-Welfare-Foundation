// A torn-paper style edge: an irregular jagged line (not a smooth wave,
// not a straight cut) filled in a solid color, with a soft drop-shadow
// that follows the jagged silhouette itself. Used at the top and bottom
// of a solid-color band (like the green impact stats section) so the
// band it's laid over reads as sitting behind a torn sheet, rather than
// two rectangles just touching at a hard line.
export function TornPaperEdge({
  color,
  position,
  className = "",
}: {
  color: string;
  position: "top" | "bottom";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      className={`absolute inset-x-0 w-full ${position === "top" ? "top-0" : "bottom-0 -scale-y-100"} ${className}`}
      style={{ filter: "drop-shadow(0 3px 5px rgba(10,12,16,0.12))" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,20 L55,33 L125,12 L190,29 L255,9 L325,27 L390,15 L460,35
           L525,11 L595,25 L660,17 L730,33 L795,13 L865,28 L930,19
           L1000,31 L1065,11 L1135,26 L1200,15 L1270,32 L1335,17
           L1400,27 L1440,20 L1440,48 L0,48 Z"
        fill={color}
      />
    </svg>
  );
}
