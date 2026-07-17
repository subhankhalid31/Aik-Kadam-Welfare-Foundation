import { ReactNode } from "react";

export function Modal({ children, onBackdropClick }: { children: ReactNode; onBackdropClick?: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onBackdropClick} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
