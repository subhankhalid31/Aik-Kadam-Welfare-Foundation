import { Logo } from "./Logo";
import { DonateButton } from "@/components/ui/DonateButton";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";

const SOCIAL_LINKS = [
  { icon: Instagram, label: "Instagram", handle: "@aikkadam", href: "https://instagram.com/aikkadam" },
  { icon: Facebook, label: "Facebook", handle: "@aikadam", href: "https://facebook.com/aikadam" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-brand-green-dark text-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-12">
          <div>
            <div className="bg-white/95 inline-flex rounded-xl px-3 py-2">
              <Logo />
            </div>
            <p className="mt-4 text-sm text-background/70 max-w-xs leading-relaxed">
              A transparent giving platform connecting donors, volunteers, and
              the people who need them, one step at a time.
            </p>
            <div className="mt-6">
              <DonateButton size="sm" />
            </div>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm uppercase tracking-wide text-background/60">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["About", "Ongoing Projects", "Gallery", "Volunteers", "FAQ"].map(
                (item) => (
                  <li key={item}>
                    <a href="#" className="text-background/85 hover:text-accent transition-colors">
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm uppercase tracking-wide text-background/60">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-background/85">
              <li className="flex items-center gap-2.5">
                <Mail size={15} /> help@aikkadam.org
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} /> +92 313 6758644
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={15} /> Lahore, Pakistan
              </li>
              <li className="flex items-center gap-2.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                aikkadamwelfare.org
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-background/15 text-xs text-background/50">
          &copy; {new Date().getFullYear()} Aik Kadam. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
