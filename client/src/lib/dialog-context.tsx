import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle, MessageSquare, Info } from "lucide-react";

type ConfirmState = { kind: "confirm"; title?: string; message: string; resolve: (v: boolean) => void };
type PromptState = { kind: "prompt"; title?: string; message: string; resolve: (v: string | null) => void };
type AlertState = { kind: "alert"; title?: string; message: string; resolve: () => void };
type DialogState = ConfirmState | PromptState | AlertState | null;

type DialogApi = {
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, title?: string) => Promise<string | null>;
  alert: (message: string, title?: string) => Promise<void>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const [inputValue, setInputValue] = useState("");

  const confirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ kind: "confirm", message, title, resolve });
    });
  }, []);

  const prompt = useCallback((message: string, title?: string) => {
    setInputValue("");
    return new Promise<string | null>((resolve) => {
      setState({ kind: "prompt", message, title, resolve });
    });
  }, []);

  const alert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setState({ kind: "alert", message, title, resolve: () => resolve() });
    });
  }, []);

  function close(result: boolean | string | null) {
    if (!state) return;
    if (state.kind === "confirm") state.resolve(result as boolean);
    if (state.kind === "prompt") state.resolve(result as string | null);
    if (state.kind === "alert") state.resolve();
    setState(null);
  }

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}

      {state && (
        <Modal onBackdropClick={() => close(state.kind === "confirm" ? false : null)}>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-accent/15 flex items-center justify-center">
              {state.kind === "confirm" && <AlertTriangle size={18} className="text-accent-dark" />}
              {state.kind === "prompt" && <MessageSquare size={18} className="text-accent-dark" />}
              {state.kind === "alert" && <Info size={18} className="text-accent-dark" />}
            </div>
            <div className="pt-1.5">
              {state.title && <p className="text-sm font-semibold text-ink mb-1">{state.title}</p>}
              <p className="text-sm text-ink/85 leading-relaxed">{state.message}</p>
            </div>
          </div>

          {state.kind === "prompt" && (
            <textarea
              autoFocus
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Optional, leave blank if you don't want to give a reason"
              className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}

          <div className="mt-5 flex justify-end gap-2">
            {state.kind !== "alert" && (
              <button
                onClick={() => close(state.kind === "confirm" ? false : null)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink border border-border hover:bg-background transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => close(state.kind === "confirm" ? true : state.kind === "prompt" ? inputValue : null)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-background bg-primary hover:bg-primary-dark transition-colors"
            >
              {state.kind === "confirm" ? "Confirm" : state.kind === "prompt" ? "Submit" : "Got it"}
            </button>
          </div>
        </Modal>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside DialogProvider");
  return ctx;
}
