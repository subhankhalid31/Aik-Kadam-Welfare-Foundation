import { motion } from "framer-motion";

// A smooth, rolling wave edge — gentle hills, not a jagged tear. Filled
// solid and given a soft drop-shadow that follows the wave's own
// silhouette (not a rectangular box-shadow), so it reads as a raised
// wavy layer rather than a flat color change at a straight line.
export function WaveEdge({
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
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      className={`absolute inset-x-0 w-full ${position === "top" ? "top-0" : "bottom-0 -scale-y-100"} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M0,60 C80,30 160,30 240,60 C320,90 400,90 480,60
           C560,30 640,30 720,60 C800,90 880,90 960,60
           C1040,30 1120,30 1200,60 C1280,90 1360,90 1440,60
           L1440,100 L0,100 Z"
        fill={color}
        animate={{
          d: [
            "M0,60 C80,30 160,30 240,60 C320,90 400,90 480,60 C560,30 640,30 720,60 C800,90 880,90 960,60 C1040,30 1120,30 1200,60 C1280,90 1360,90 1440,60 L1440,100 L0,100 Z",
            "M0,55 C80,35 160,35 240,55 C320,75 400,75 480,55 C560,35 640,35 720,55 C800,75 880,75 960,55 C1040,35 1120,35 1200,55 C1280,75 1360,75 1440,55 L1440,100 L0,100 Z",
            "M0,60 C80,30 160,30 240,60 C320,90 400,90 480,60 C560,30 640,30 720,60 C800,90 880,90 960,60 C1040,30 1120,30 1200,60 C1280,90 1360,90 1440,60 L1440,100 L0,100 Z",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}
