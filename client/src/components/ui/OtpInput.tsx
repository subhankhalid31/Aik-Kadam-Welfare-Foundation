import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  /** Bump this to any new value (e.g. a counter) to trigger the shake animation. */
  shakeKey?: number;
  disabled?: boolean;
};

export function OtpInput({ length = 6, value, onChange, onComplete, shakeKey, disabled }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const shakeControls = useAnimation();
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  // Re-shake the whole row whenever the parent signals a wrong code —
  // driven by a changing key rather than a boolean so repeated wrong
  // attempts each get their own shake, not just the first.
  useEffect(() => {
    if (shakeKey === undefined || shakeKey === 0) return;
    shakeControls.start({
      x: [0, -9, 9, -7, 7, -4, 4, 0],
      transition: { duration: 0.4, ease: "easeInOut" },
    });
    // Move focus back to the first box so the user can type straight away.
    inputsRef.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeKey]);

  function setDigit(i: number, char: string) {
    const next = digits.slice();
    next[i] = char;
    const joined = next.join("");
    onChange(joined);
    if (joined.length === length && !joined.includes("")) onComplete?.(joined);
  }

  function handleChange(i: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) {
      setDigit(i, "");
      return;
    }
    setDigit(i, char);
    if (i < length - 1) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        setDigit(i, "");
      } else if (i > 0) {
        inputsRef.current[i - 1]?.focus();
        setDigit(i - 1, "");
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    requestAnimationFrame(() => inputsRef.current[focusIndex]?.focus());
    if (pasted.length === length) onComplete?.(pasted);
  }

  return (
    <motion.div animate={shakeControls} className="flex justify-center gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <motion.input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={`h-12 w-10 sm:h-14 sm:w-12 rounded-xl border text-center text-xl font-semibold font-mono text-ink bg-white
            transition-[transform,border-color,box-shadow] duration-150 ease-out
            focus:outline-none focus:scale-[1.06] focus:border-primary focus:ring-2 focus:ring-primary/25
            ${d ? "border-primary/50" : "border-border"}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </motion.div>
  );
}
