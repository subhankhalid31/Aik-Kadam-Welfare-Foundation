import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, Children, createContext } from "react";
import { useLocation } from "wouter";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, Mail, User, Lock, Eye, EyeOff, ArrowLeft, X, AlertCircle, PartyPopper, Loader } from "lucide-react";
import { AnimatePresence, motion, useInView, type Variants, type Transition } from "framer-motion";
import confetti from "canvas-confetti";
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";
import { CanvasRevealEffect } from "@/components/ui/CanvasRevealEffect";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ─────────────────────────────────────────────────────────────────────────
// This page ports a "liquid glass" auth UI (originally a 21st.dev demo
// component) onto Aik Kadam's real signup flow. Three things changed from
// the demo on purpose:
//   1. Background is our own CanvasRevealEffect particle field, not the
//      demo's gradient blobs — darkened and de-blued so it reads through
//      the glass blur instead of washing out.
//   2. The GitHub button and fake Google button are gone. There's exactly
//      one working OAuth path (Google), using the site's real
//      GoogleSignInButton — a decorative-only OAuth button would be a
//      broken control sitting on a signup form.
//   3. The multi-step "sign up" animation now drives a real
//      POST /api/auth/signup call and hands off to the real OTP-verify
//      step, instead of a fixed-timer fake loading sequence.
// ─────────────────────────────────────────────────────────────────────────

// ─── Confetti (unchanged from the source component) ───────────────────────
type ConfettiApi = { fire: (options?: ConfettiOptions) => void };
type ConfettiRef = ConfettiApi | null;
const ConfettiContext = createContext<ConfettiApi>({} as ConfettiApi);

const Confetti = forwardRef<
  ConfettiRef,
  React.ComponentPropsWithRef<"canvas"> & {
    options?: ConfettiOptions;
    globalOptions?: ConfettiGlobalOptions;
    manualstart?: boolean;
  }
>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);
  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
      } else if (instanceRef.current) {
        instanceRef.current.reset();
        instanceRef.current = null;
      }
    },
    [globalOptions]
  );
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options]);
  const apiRef = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => apiRef, [apiRef]);
  useEffect(() => {
    if (!manualstart) fire();
  }, [manualstart, fire]);
  return <canvas ref={canvasRef} {...rest} />;
});
Confetti.displayName = "Confetti";
void ConfettiContext;

// ─── TextLoop — cycles through children on an interval ────────────────────
function TextLoop({
  children,
  className,
  interval = 2,
  transition = { duration: 0.3 },
  variants,
}: {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
  transition?: Transition;
  variants?: Variants;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % items.length);
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [items.length, interval]);
  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  return (
    <div className={cn("relative inline-block whitespace-nowrap", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={currentIndex} initial="initial" animate="animate" exit="exit" transition={transition} variants={variants || motionVariants}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── BlurFade — fade+blur reveal on mount / scroll-into-view ──────────────
function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = true,
  inViewMargin = "-50px",
  blur = "8px",
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as any });
  const isInView = !inView || inViewResult;
  const variants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      exit="hidden"
      variants={variants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── GlassButton ────────────────────────────────────────────────────────
const glassButtonVariants = cva("relative isolate all-unset cursor-pointer rounded-full transition-all", {
  variants: { size: { default: "text-base font-medium", sm: "text-sm font-medium", lg: "text-lg font-medium", icon: "h-10 w-10" } },
  defaultVariants: { size: "default" },
});
const glassButtonTextVariants = cva("glass-button-text relative block select-none tracking-tighter", {
  variants: { size: { default: "px-6 py-3.5", sm: "px-4 py-2", lg: "px-8 py-4", icon: "flex h-10 w-10 items-center justify-center" } },
  defaultVariants: { size: "default" },
});
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}
const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, onClick, ...props }, ref) => {
    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const button = e.currentTarget.querySelector("button");
      if (button && e.target !== button) button.click();
    };
    return (
      <div className={cn("glass-button-wrap cursor-pointer rounded-full relative", className)} onClick={handleWrapperClick}>
        <button className={cn("glass-button relative z-10", glassButtonVariants({ size }))} ref={ref} onClick={onClick} {...props}>
          <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none" />
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

// ─── Loading/success/error steps for the submit modal ──────────────────────
const loadingMessages = ["Creating your account...", "Almost there..."];
const TEXT_LOOP_INTERVAL = 1.6;

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authStep, setAuthStep] = useState<"email" | "name" | "password" | "confirmPassword">("email");
  const [modalStatus, setModalStatus] = useState<"closed" | "loading" | "error" | "success">("closed");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [oauthError, setOauthError] = useState("");
  const confettiRef = useRef<ConfettiRef>(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isNameValid = name.trim().length >= 2;
  const isPasswordValid = password.length >= 8;
  const isConfirmPasswordValid = confirmPassword.length >= 8;

  const nameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (!fire) return;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    fire({ ...defaults, particleCount: 50, origin: { x: 0, y: 1 }, angle: 60 });
    fire({ ...defaults, particleCount: 50, origin: { x: 1, y: 1 }, angle: 120 });
  };

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modalStatus !== "closed" || authStep !== "confirmPassword") return;

    if (password !== confirmPassword) {
      setModalErrorMessage("Passwords do not match!");
      setModalStatus("error");
      return;
    }

    setModalStatus("loading");
    try {
      await api.post("/api/auth/signup", { name: name.trim(), email, password });
      setModalStatus("success");
      fireSideCanons();
    } catch (err) {
      setModalErrorMessage(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setModalStatus("error");
    }
  }

  const handleProgressStep = () => {
    if (authStep === "email") {
      if (isEmailValid) setAuthStep("name");
    } else if (authStep === "name") {
      if (isNameValid) setAuthStep("password");
    } else if (authStep === "password") {
      if (isPasswordValid) setAuthStep("confirmPassword");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleProgressStep();
    }
  };

  const handleGoBack = () => {
    if (authStep === "confirmPassword") {
      setAuthStep("password");
      setConfirmPassword("");
    } else if (authStep === "password") {
      setAuthStep("name");
    } else if (authStep === "name") {
      setAuthStep("email");
    }
  };

  const closeModal = () => {
    setModalStatus("closed");
    setModalErrorMessage("");
  };

  const goToVerifyOtp = () => {
    navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=signup`);
  };

  useEffect(() => {
    if (authStep === "name") setTimeout(() => nameInputRef.current?.focus(), 500);
    else if (authStep === "password") setTimeout(() => passwordInputRef.current?.focus(), 500);
    else if (authStep === "confirmPassword") setTimeout(() => confirmPasswordInputRef.current?.focus(), 500);
  }, [authStep]);

  const Modal = () => (
    <AnimatePresence>
      {modalStatus !== "closed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/90 border border-white/60 rounded-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4"
          >
            {(modalStatus === "error" || modalStatus === "success") && (
              <button onClick={closeModal} className="absolute top-2 right-2 p-1 text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
            {modalStatus === "error" && (
              <>
                <AlertCircle className="w-12 h-12 text-danger" />
                <p className="text-lg font-medium text-ink text-center">{modalErrorMessage}</p>
                <GlassButton type="button" onClick={closeModal} size="sm" className="mt-4">
                  Try Again
                </GlassButton>
              </>
            )}
            {modalStatus === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <Loader className="w-12 h-12 text-primary animate-spin" />
                <TextLoop interval={TEXT_LOOP_INTERVAL}>
                  {loadingMessages.map((msg, i) => (
                    <p key={i} className="text-lg font-medium text-ink">
                      {msg}
                    </p>
                  ))}
                </TextLoop>
              </div>
            )}
            {modalStatus === "success" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <PartyPopper className="w-12 h-12 text-success" />
                <p className="text-lg font-medium text-ink">Account created!</p>
                <p className="text-sm text-muted -mt-2">We've sent a verification code to {email}.</p>
                <GlassButton type="button" onClick={goToVerifyOtp} size="sm" className="mt-2">
                  Verify email
                </GlassButton>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <PageLayout>
      <style>{`
input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; } input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; } input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px transparent inset !important; -webkit-text-fill-color: #0B1F17 !important; background-color: transparent !important; background-clip: content-box !important; transition: background-color 5000s ease-in-out 0s !important; color: #0B1F17 !important; caret-color: #0B1F17 !important; } input:autofill { background-color: transparent !important; background-clip: content-box !important; -webkit-text-fill-color: #0B1F17 !important; color: #0B1F17 !important; } input:-internal-autofill-selected { background-color: transparent !important; background-image: none !important; color: #0B1F17 !important; -webkit-text-fill-color: #0B1F17 !important; } input:-webkit-autofill::first-line { color: #0B1F17 !important; -webkit-text-fill-color: #0B1F17 !important; }
@property --angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; } @property --angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; }
.glass-button-wrap { --anim-time: 400ms; --anim-ease: cubic-bezier(0.25, 1, 0.5, 1); --border-width: clamp(1px, 0.0625em, 4px); position: relative; z-index: 2; transform-style: preserve-3d; transition: transform var(--anim-time) var(--anim-ease); } .glass-button-wrap:has(.glass-button:active) { transform: rotateX(25deg); } .glass-button-shadow { --shadow-cutoff-fix: 2em; position: absolute; width: calc(100% + var(--shadow-cutoff-fix)); height: calc(100% + var(--shadow-cutoff-fix)); top: calc(0% - var(--shadow-cutoff-fix) / 2); left: calc(0% - var(--shadow-cutoff-fix) / 2); filter: blur(clamp(2px, 0.125em, 12px)); transition: filter var(--anim-time) var(--anim-ease); pointer-events: none; z-index: 0; } .glass-button-shadow::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; background: linear-gradient(180deg, rgba(11, 31, 23, 0.2), rgba(11, 31, 23, 0.1)); width: calc(100% - var(--shadow-cutoff-fix) - 0.25em); height: calc(100% - var(--shadow-cutoff-fix) - 0.25em); top: calc(var(--shadow-cutoff-fix) - 0.5em); left: calc(var(--shadow-cutoff-fix) - 0.875em); padding: 0.125em; box-sizing: border-box; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease); opacity: 1; }
.glass-button { -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all var(--anim-time) var(--anim-ease); background: linear-gradient(-75deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05)); box-shadow: inset 0 0.125em 0.125em rgba(11, 31, 23, 0.05), inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5), 0 0.25em 0.125em -0.125em rgba(11, 31, 23, 0.2), 0 0 0.1em 0.25em inset rgba(255, 255, 255, 0.2), 0 0 0 0 rgb(255, 255, 255); } .glass-button:hover { transform: scale(0.975); backdrop-filter: blur(0.01em); box-shadow: inset 0 0.125em 0.125em rgba(11, 31, 23, 0.05), inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5), 0 0.15em 0.05em -0.1em rgba(11, 31, 23, 0.25), 0 0 0.05em 0.1em inset rgba(255, 255, 255, 0.5), 0 0 0 0 rgb(255, 255, 255); } .glass-button-text { color: rgba(11, 31, 23, 0.9); text-shadow: 0em 0.25em 0.05em rgba(11, 31, 23, 0.1); transition: all var(--anim-time) var(--anim-ease); } .glass-button:hover .glass-button-text { text-shadow: 0.025em 0.025em 0.025em rgba(11, 31, 23, 0.12); } .glass-button-text::after { content: ""; display: block; position: absolute; width: calc(100% - var(--border-width)); height: calc(100% - var(--border-width)); top: calc(0% + var(--border-width) / 2); left: calc(0% + var(--border-width) / 2); box-sizing: border-box; border-radius: 9999px; overflow: clip; background: linear-gradient(var(--angle-2), transparent 0%, rgba(255, 255, 255, 0.5) 40% 50%, transparent 55%); z-index: 3; mix-blend-mode: screen; pointer-events: none; background-size: 200% 200%; background-position: 0% 50%; transition: background-position calc(var(--anim-time) * 1.25) var(--anim-ease), --angle-2 calc(var(--anim-time) * 1.25) var(--anim-ease); } .glass-button:hover .glass-button-text::after { background-position: 25% 50%; } .glass-button:active .glass-button-text::after { background-position: 50% 15%; --angle-2: -15deg; } .glass-button::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + var(--border-width)); height: calc(100% + var(--border-width)); top: calc(0% - var(--border-width) / 2); left: calc(0% - var(--border-width) / 2); padding: var(--border-width); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, rgba(11, 31, 23, 0.5) 0%, transparent 5% 40%, rgba(11, 31, 23, 0.5) 50%, transparent 60% 95%, rgba(11, 31, 23, 0.5) 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease), --angle-1 500ms ease; box-shadow: inset 0 0 0 calc(var(--border-width) / 2) rgba(255, 255, 255, 0.5); pointer-events: none; } .glass-button:hover::after { --angle-1: -125deg; } .glass-button:active::after { --angle-1: -75deg; } .glass-button-wrap:has(.glass-button:hover) .glass-button-shadow { filter: blur(clamp(2px, 0.0625em, 6px)); } .glass-button-wrap:has(.glass-button:hover) .glass-button-shadow::after { top: calc(var(--shadow-cutoff-fix) - 0.875em); opacity: 1; } .glass-button-wrap:has(.glass-button:active) .glass-button-shadow { filter: blur(clamp(2px, 0.125em, 12px)); } .glass-button-wrap:has(.glass-button:active) .glass-button-shadow::after { top: calc(var(--shadow-cutoff-fix) - 0.5em); opacity: 0.75; } .glass-button-wrap:has(.glass-button:active) .glass-button-text { text-shadow: 0.025em 0.25em 0.05em rgba(11, 31, 23, 0.12); } .glass-button-wrap:has(.glass-button:active) .glass-button { box-shadow: inset 0 0.125em 0.125em rgba(11, 31, 23, 0.05), inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5), 0 0.125em 0.125em -0.125em rgba(11, 31, 23, 0.2), 0 0 0.1em 0.25em inset rgba(255, 255, 255, 0.2), 0 0.225em 0.05em 0 rgba(11, 31, 23, 0.05), 0 0.25em 0 0 rgba(255, 255, 255, 0.75), inset 0 0.25em 0.05em 0 rgba(11, 31, 23, 0.15); } @media (hover: none) and (pointer: coarse) { .glass-button::after, .glass-button:hover::after, .glass-button:active::after { --angle-1: -75deg; } .glass-button .glass-button-text::after, .glass-button:active .glass-button-text::after { --angle-2: -45deg; } }
.glass-input-wrap { position: relative; z-index: 2; transform-style: preserve-3d; border-radius: 9999px; } .glass-input { display: flex; position: relative; width: 100%; align-items: center; gap: 0.5rem; border-radius: 9999px; padding: 0.25rem; -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1); background: linear-gradient(-75deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05)); box-shadow: inset 0 0.125em 0.125em rgba(11, 31, 23, 0.05), inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5), 0 0.25em 0.125em -0.125em rgba(11, 31, 23, 0.2), 0 0 0.1em 0.25em inset rgba(255, 255, 255, 0.2), 0 0 0 0 rgb(255, 255, 255); } .glass-input-wrap:focus-within .glass-input { backdrop-filter: blur(0.01em); box-shadow: inset 0 0.125em 0.125em rgba(11, 31, 23, 0.05), inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5), 0 0.15em 0.05em -0.1em rgba(11, 31, 23, 0.25), 0 0 0.05em 0.1em inset rgba(255, 255, 255, 0.5), 0 0 0 0 rgb(255, 255, 255); } .glass-input::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + clamp(1px, 0.0625em, 4px)); height: calc(100% + clamp(1px, 0.0625em, 4px)); top: calc(0% - clamp(1px, 0.0625em, 4px) / 2); left: calc(0% - clamp(1px, 0.0625em, 4px) / 2); padding: clamp(1px, 0.0625em, 4px); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, rgba(11, 31, 23, 0.5) 0%, transparent 5% 40%, rgba(11, 31, 23, 0.5) 50%, transparent 60% 95%, rgba(11, 31, 23, 0.5) 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1), --angle-1 500ms ease; box-shadow: inset 0 0 0 calc(clamp(1px, 0.0625em, 4px) / 2) rgba(255, 255, 255, 0.5); pointer-events: none; } .glass-input-wrap:focus-within .glass-input::after { --angle-1: -125deg; } .glass-input-text-area { position: absolute; inset: 0; border-radius: 9999px; pointer-events: none; } .glass-input-text-area::after { content: ""; display: block; position: absolute; width: calc(100% - clamp(1px, 0.0625em, 4px)); height: calc(100% - clamp(1px, 0.0625em, 4px)); top: calc(0% + clamp(1px, 0.0625em, 4px) / 2); left: calc(0% + clamp(1px, 0.0625em, 4px) / 2); box-sizing: border-box; border-radius: 9999px; overflow: clip; background: linear-gradient(var(--angle-2), transparent 0%, rgba(255, 255, 255, 0.5) 40% 50%, transparent 55%); z-index: 3; mix-blend-mode: screen; pointer-events: none; background-size: 200% 200%; background-position: 0% 50%; transition: background-position calc(400ms * 1.25) cubic-bezier(0.25, 1, 0.5, 1), --angle-2 calc(400ms * 1.25) cubic-bezier(0.25, 1, 0.5, 1); } .glass-input-wrap:focus-within .glass-input-text-area::after { background-position: 25% 50%; }

      `}</style>

      <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
      <Modal />

      <main className="relative overflow-hidden bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
        {/* Same particle field as the rest of the site, but pulled way down in
            saturation and brightness — a light, fully-saturated brand blue
            here would wash out completely once seen through the glass
            blur (that's what created the "box" look before). Darker,
            mostly-neutral dots with only a faint blue cast read clearly
            through backdrop-blur instead. */}
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={2}
            containerClassName="bg-background"
            colors={[
              [17, 19, 23],
              [23, 26, 32],
              [34, 45, 68],
            ]}
            dotSize={6}
            totalSize={12}
            opacities={[0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.88, 0.94, 0.98, 1]}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(246,247,245,0.02)_0%,_rgba(246,247,245,0.35)_85%)]" />

        <fieldset disabled={modalStatus !== "closed"} className="relative z-10 flex flex-col items-center gap-8 w-[280px] mx-auto">
          <AnimatePresence mode="wait">
            {authStep === "email" && (
              <motion.div key="email-content" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4">
                <BlurFade delay={0.25} className="w-full">
                  <p className="text-center font-serif font-light text-4xl sm:text-5xl tracking-tight text-ink">Get started with Us</p>
                </BlurFade>
                <BlurFade delay={0.5}>
                  <p className="text-sm text-black opacity-70">Create an account to donate, volunteer, or submit a case.</p>
                </BlurFade>
              </motion.div>
            )}
            {authStep === "name" && (
              <motion.div key="name-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
                <BlurFade className="w-full">
                  <p className="text-center font-serif font-light text-4xl sm:text-5xl tracking-tight text-ink">What should we call you?</p>
                </BlurFade>
              </motion.div>
            )}
            {authStep === "password" && (
              <motion.div key="password-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
                <BlurFade className="w-full">
                  <p className="text-center font-serif font-light text-4xl sm:text-5xl tracking-tight text-ink">Create your password</p>
                </BlurFade>
                <BlurFade delay={0.25}>
                  <p className="text-sm text-muted">Must be at least 8 characters long.</p>
                </BlurFade>
              </motion.div>
            )}
            {authStep === "confirmPassword" && (
              <motion.div key="confirm-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
                <BlurFade className="w-full">
                  <p className="text-center font-serif font-light text-4xl sm:text-5xl tracking-tight text-ink">One last step</p>
                </BlurFade>
                <BlurFade delay={0.25}>
                  <p className="text-sm text-muted">Confirm your password to continue</p>
                </BlurFade>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleFinalSubmit} className="w-[300px] space-y-6">
            <AnimatePresence>
              {authStep !== "confirmPassword" && (
                <motion.div key="fields" exit={{ opacity: 0, filter: "blur(4px)" }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full space-y-6">
                  {/* Email */}
                  <BlurFade delay={authStep === "email" ? 0.75 : 0} inView className="w-full">
                    <div className="relative w-full">
                      <AnimatePresence>
                        {authStep !== "email" && (
                          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }} className="absolute -top-6 left-4 z-10">
                            <label className="text-xs text-black opacity-60 font-semibold">Email</label>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="glass-input-wrap w-full">
                        <div className="glass-input">
                          <span className="glass-input-text-area" />
                          <div className={cn("relative z-10 flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out", email.length > 20 && authStep === "email" ? "w-0 px-0" : "w-10 pl-2")}>
                            <Mail className="h-5 w-5 text-ink/70 flex-shrink-0" />
                          </div>
                          <input
                            type="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={authStep !== "email"}
                            className={cn("relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none transition-[padding-right] duration-300 ease-in-out delay-300", isEmailValid && authStep === "email" ? "pr-2" : "pr-0")}
                          />
                          <div className={cn("relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isEmailValid && authStep === "email" ? "w-10 pr-1" : "w-0")}>
                            <GlassButton type="button" onClick={handleProgressStep} size="icon" aria-label="Continue with email" contentClassName="text-ink/70 hover:text-ink">
                              <ArrowRight className="w-5 h-5" />
                            </GlassButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </BlurFade>

                  {/* Google — real sign-in, shown while the form's still on step 1 */}
                  <AnimatePresence>
                    {authStep === "email" && (
                      <BlurFade key="google" delay={1} className="w-full">
                        {oauthError && <p className="text-sm text-danger text-center mb-2">{oauthError}</p>}
                        <GoogleSignInButton
                          onSuccess={async (role) => {
                            await refresh();
                            navigate(role === "admin" ? "/admin" : "/");
                          }}
                          onError={setOauthError}
                        />
                      </BlurFade>
                    )}
                  </AnimatePresence>

                  {/* Name */}
                  <AnimatePresence>
                    {authStep === "name" && (
                      <BlurFade key="name-field" className="w-full">
                        <div className="relative w-full">
                          <AnimatePresence>
                            {name.length > 0 && (
                              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10">
                                <label className="text-xs text-muted font-semibold">Name</label>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="glass-input-wrap w-full">
                            <div className="glass-input">
                              <span className="glass-input-text-area" />
                              <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                                <User className="h-5 w-5 text-ink/70 flex-shrink-0" />
                              </div>
                              <input
                                ref={nameInputRef}
                                type="text"
                                placeholder="Full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none"
                              />
                              <div className={cn("relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isNameValid ? "w-10 pr-1" : "w-0")}>
                                <GlassButton type="button" onClick={handleProgressStep} size="icon" aria-label="Continue with name" contentClassName="text-ink/70 hover:text-ink">
                                  <ArrowRight className="w-5 h-5" />
                                </GlassButton>
                              </div>
                            </div>
                          </div>
                        </div>
                        <BlurFade inView delay={0.2}>
                          <button type="button" onClick={handleGoBack} className="mt-4 flex items-center gap-2 text-sm text-ink/70 hover:text-ink transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Go back
                          </button>
                        </BlurFade>
                      </BlurFade>
                    )}
                  </AnimatePresence>

                  {/* Password */}
                  <AnimatePresence>
                    {authStep === "password" && (
                      <BlurFade key="password-field" className="w-full">
                        <div className="relative w-full">
                          <AnimatePresence>
                            {password.length > 0 && (
                              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10">
                                <label className="text-xs text-muted font-semibold">Password</label>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="glass-input-wrap w-full">
                            <div className="glass-input">
                              <span className="glass-input-text-area" />
                              <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                                {isPasswordValid ? (
                                  <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="text-ink/70 hover:text-ink transition-colors p-2 rounded-full">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                  </button>
                                ) : (
                                  <Lock className="h-5 w-5 text-ink/70 flex-shrink-0" />
                                )}
                              </div>
                              <input
                                ref={passwordInputRef}
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none"
                              />
                              <div className={cn("relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isPasswordValid ? "w-10 pr-1" : "w-0")}>
                                <GlassButton type="button" onClick={handleProgressStep} size="icon" aria-label="Continue with password" contentClassName="text-ink/70 hover:text-ink">
                                  <ArrowRight className="w-5 h-5" />
                                </GlassButton>
                              </div>
                            </div>
                          </div>
                        </div>
                        <BlurFade inView delay={0.2}>
                          <button type="button" onClick={handleGoBack} className="mt-4 flex items-center gap-2 text-sm text-ink/70 hover:text-ink transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Go back
                          </button>
                        </BlurFade>
                      </BlurFade>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm password */}
            <AnimatePresence>
              {authStep === "confirmPassword" && (
                <BlurFade key="confirm-field" className="w-full">
                  <div className="relative w-full">
                    <AnimatePresence>
                      {confirmPassword.length > 0 && (
                        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10">
                          <label className="text-xs text-muted font-semibold">Confirm password</label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="glass-input-wrap w-[300px]">
                      <div className="glass-input">
                        <span className="glass-input-text-area" />
                        <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                          {isConfirmPasswordValid ? (
                            <button type="button" aria-label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-ink/70 hover:text-ink transition-colors p-2 rounded-full">
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          ) : (
                            <Lock className="h-5 w-5 text-ink/70 flex-shrink-0" />
                          )}
                        </div>
                        <input
                          ref={confirmPasswordInputRef}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="relative z-10 h-full w-0 flex-grow bg-transparent text-ink placeholder:text-ink/50 focus:outline-none"
                        />
                        <div className={cn("relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isConfirmPasswordValid ? "w-10 pr-1" : "w-0")}>
                          <GlassButton type="submit" size="icon" aria-label="Finish sign-up" contentClassName="text-ink/70 hover:text-ink">
                            <ArrowRight className="w-5 h-5" />
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  </div>
                  <BlurFade inView delay={0.2}>
                    <button type="button" onClick={handleGoBack} className="mt-4 flex items-center gap-2 text-sm text-ink/70 hover:text-ink transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Go back
                    </button>
                  </BlurFade>
                </BlurFade>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center text-sm text-ink/60">
            Already have an account?{" "}
            <a href="/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
              Log in
            </a>
          </p>
        </fieldset>
      </main>
    </PageLayout>
  );
}
