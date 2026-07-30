import { useEffect, useRef, useState } from "react";
import { Share2, Copy, Check, MessageCircle, Facebook, Twitter, Mail } from "lucide-react";

export function ShareCasePopover({ caseId, title }: { caseId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/ongoing-projects?case=${caseId}`;
  const shareText = `Help support: ${title}`;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback for browsers/contexts without clipboard API access.
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const platforms = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <div className="relative shrink-0" ref={boxRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="Share this case"
        className="glass-surface glass-surface-outline h-[46px] w-[46px] inline-flex items-center justify-center rounded-full border text-ink transition-colors"
      >
        <Share2 size={16} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 bottom-full mb-2 z-20 w-72 glass-panel rounded-2xl p-4"
        >
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Share this case</p>

          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 rounded-full border border-white/70 bg-white/50 backdrop-blur-sm px-3.5 py-2 text-xs text-ink/80 truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={copyLink}
              className={`glass-surface shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                copied ? "bg-primary/10 text-primary" : "bg-primary/65 text-background hover:bg-primary-dark"
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${p.name}`}
                className="glass-surface glass-surface-outline h-9 w-9 inline-flex items-center justify-center rounded-full border text-ink hover:text-primary transition-colors"
              >
                <p.icon size={15} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
