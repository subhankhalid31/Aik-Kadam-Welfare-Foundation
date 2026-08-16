// A single hand-drawn-looking paint stroke: a thick flat ribbon with a
// rough, torn edge along both the top and bottom (built from many short
// jagged line segments rather than smooth curves) and torn diagonal ends
// — reads as a real dragged brush mark, not a smooth blob or a thin wavy
// line.
export function BrushStroke({
  color,
  className = "",
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 100"
      className={className}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15,50 L35,30 L55,42 L75,26 L95,40 L120,24 L145,36 L170,22 L195,34
           L220,24 L245,36 L270,26 L295,38 L320,28 L345,40 L365,32 L385,46
           L390,60
           L378,78 L358,64 L338,80 L315,66 L292,82 L268,68 L244,84 L220,70
           L196,86 L172,72 L148,84 L124,70 L100,86 L76,72 L52,84 L28,70 L12,64
           Z"
        fill={color}
      />
    </svg>
  );
}
