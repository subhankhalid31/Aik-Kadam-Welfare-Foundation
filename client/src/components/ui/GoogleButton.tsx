import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// The Google Identity Services script is loaded once and shared across
// every GoogleButton instance that might mount during the session.
let gsiPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });
  return gsiPromise;
}

type GoogleButtonProps = {
  mode: "signin" | "signup";
  onSuccess: (role: string) => void;
  onError: (message: string) => void;
};

export function GoogleButton({ mode, onSuccess, onError }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response: { credential: string }) => {
            try {
              const data = await api.post<{ user: { role: string } }>("/api/auth/google", {
                idToken: response.credential,
              });
              onSuccess(data.user.role);
            } catch (err) {
              onError(err instanceof ApiError ? err.message : "Google sign-in failed. Please try again.");
            }
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          logo_alignment: "center",
          width: containerRef.current.offsetWidth || 340,
          text: mode === "signup" ? "signup_with" : "signin_with",
        });
        setReady(true);
      })
      .catch(() => onError("Couldn't load Google Sign-In. Check your connection and try again."));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (!CLIENT_ID) return null;

  return (
    <div className="relative w-full">
      {!ready && <div className="h-11 w-full rounded-full border border-border bg-border/30 animate-pulse" />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`w-full flex justify-center ${ready ? "" : "absolute inset-0 pointer-events-none"}`}
      >
        <div ref={containerRef} className="w-full [&>div]:!w-full" />
      </motion.div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
