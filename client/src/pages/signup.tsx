import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, Children, createContext } from "react";
import { useLocation } from "wouter";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, Mail, User, Lock, Eye, EyeOff, ArrowLeft, X, AlertCircle, PartyPopper, Loader } from "lucide-react";
import { AnimatePresence, motion, type Variants, type Transition } from "framer-motion";
import confetti from "canvas-confetti";
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { BlurFade } from "@/components/ui/BlurFade";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SIGNUP_STEPS = [
  { title: "Create your account", description: "Just an email, a name, and a password to start." },
  { title: "Verify your email", description: "A quick code confirms it's really you." },
  { title: "Start making an impact", description: "Donate, volunteer, or submit a case in minutes." },
];

// ─────────────────────────────────────────────────────────────────────────
// This page ports a "liquid glass" auth UI (originally a 21st.dev demo
// component) onto Aik Kadam's real signup flow. Three things changed from
// the demo on purpose:
//   1. Background sits inside AuthSplitLayout (shared with login/forgot-
//      password) instead of the demo's gradient blobs — a static right-
//      side panel, not an animated particle field, since that field was
//      the thing making these pages slow.
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
    <PageLayout transparentHero navTheme="light">
      <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
      <Modal />

      <AuthSplitLayout
        eyebrow="Sign Up"
        heading="Get started with Aik Kadam."
        subheading="Complete these easy steps to create your account."
        steps={SIGNUP_STEPS}
      >
        <fieldset disabled={modalStatus !== "closed"} className="relative z-10 flex flex-col items-center gap-8 w-[280px] mx-auto">
          <AnimatePresence mode="wait">
            {authStep === "email" && (
              <motion.div key="email-content" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4">
                <BlurFade delay={0.25} className="w-full">
                  <p className="text-center font-serif font-light text-4xl sm:text-5xl tracking-tight text-ink">
                    <span className="text-black">Get started</span> with Us
                  </p>
                </BlurFade>
                <BlurFade delay={0.5}>
                  <p className="text-sm text-muted text-center ">Create an account to donate, volunteer, or submit a case.</p>
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
                            <label className="text-xs text-muted font-semibold">Email</label>
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
      </AuthSplitLayout>
    </PageLayout>
  );
}
