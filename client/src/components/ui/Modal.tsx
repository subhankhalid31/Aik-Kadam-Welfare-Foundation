import { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({ children, onBackdropClick, onClose }: { children: ReactNode; onBackdropClick?: () => void; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      <motion.div
        className="relative glass-panel rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {(onClose || onBackdropClick) && (
          <button
            onClick={onClose ?? onBackdropClick}
            aria-label="Close"
            className="glass-surface absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center text-ink transition-all duration-200 hover:bg-white hover:-translate-y-0.5"
          >
            <X size={16} />
          </button>
        )}
        <div className="scrollbar-hover-reveal overflow-y-auto p-6">{children}</div>
      </motion.div>
    </div>
  );
}
