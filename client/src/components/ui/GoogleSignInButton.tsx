import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

declare global {
  interface Window {
    google?: any;
  }
}

let gsiScriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (gsiScriptPromise) return gsiScriptPromise;
  gsiScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  theme = "light",
}: {
  onSuccess: (role: string) => void;
  onError: (message: string) => void;
  theme?: "light" | "dark";
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    // No client ID configured — render nothing rather than a broken button.
    // See .env.example for how to set VITE_GOOGLE_CLIENT_ID.
    if (!clientId) {
      setUnavailable(true);
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            try {
              const data = await api.post<{ user: { role: string } }>("/api/auth/google", {
                credential: response.credential,
              });
              onSuccess(data.user.role);
            } catch (err) {
              onError(err instanceof ApiError ? err.message : "Google sign-in failed. Please try again.");
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          width: buttonRef.current.offsetWidth || 320,
          shape: "pill",
          text: "continue_with",
        });
      })
      .catch(() => setUnavailable(true));

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError, theme]);

  if (unavailable) return null;

  return (
    <div className="mt-2">
      <div className="relative my-5 flex items-center gap-3">
        <div className={`h-px flex-1 ${theme === "dark" ? "bg-white/15" : "bg-border"}`} />
        <span className={`text-xs uppercase tracking-wide ${theme === "dark" ? "text-white/40" : "text-muted"}`}>or</span>
        <div className={`h-px flex-1 ${theme === "dark" ? "bg-white/15" : "bg-border"}`} />
      </div>
      <div ref={buttonRef} className="flex justify-center" />
    </div>
  );
}
