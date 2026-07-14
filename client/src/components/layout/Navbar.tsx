import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  Menu, X, User, LayoutDashboard, ChevronDown, Heart, HelpCircle, LogOut,
  Briefcase, Image as ImageIcon, Map, Users, Mail, Handshake, ShieldCheck, Search,
  Compass, HeartHandshake,
} from "lucide-react";
import { Logo } from "./Logo";
import { DonateButton } from "@/components/ui/DonateButton";
import { SearchModal } from "@/components/ui/SearchModal";
import { useGlobalSearch, type SearchTab } from "@/hooks/useGlobalSearch";
import { SearchTabs, SearchResultsList } from "@/components/ui/SearchResults";
import { useAuth } from "@/lib/auth-context";

const PROJECT_LINKS = [
  { label: "Ongoing Projects", desc: "See active cases in progress", href: "/ongoing-projects", icon: Briefcase },
  { label: "Completed Projects", desc: "Browse projects we've finished", href: "/completed-projects", icon: ImageIcon },
  { label: "Project Map", desc: "View every location on a map", href: "/project-map", icon: Map },
];

const PROJECTS_HEADER = { icon: Compass, title: "Explore our projects" };

const GET_INVOLVED_LINKS = [
  { label: "Volunteers", desc: "Meet our volunteer community", href: "/volunteers", icon: Users },
  { label: "Contact Us", desc: "Reach out with any questions", href: "/contact", icon: Mail },
  { label: "Partner With Us", desc: "Explore partnership opportunities", href: "/partner", icon: Handshake },
];

const GET_INVOLVED_HEADER = { icon: HeartHandshake, title: "Ways to get involved" };

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<SearchTab>("Cases");
  const { filteredCases, filteredVolunteers, filteredStories } = useGlobalSearch(mobileQuery);
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);
  const [mobileInvolvedOpen, setMobileInvolvedOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await logout();
    setOpen(false);
    setMobileQuery("");
    navigate("/");
  }

  function closeMobileMenu() {
    setOpen(false);
    setMobileQuery("");
  }

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "bg-background/75 border-b border-border shadow-[0_4px_20px_-4px_rgba(2,32,71,0.10)]"
          : "bg-background/40 border-b border-transparent shadow-[0_4px_20px_-6px_rgba(2,32,71,0.06)]"
      }`}
    >
      {/* GoFundMe-style layout: nav links split left/right, logo centered */}
      <nav className="max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-6 min-w-0 justify-self-start">
          <button className="md:hidden text-ink shrink-0" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-base font-light text-ink/80 hover:text-primary transition-colors">About</Link>
            <NavDropdown label="Projects" items={PROJECT_LINKS} header={PROJECTS_HEADER} />
            <Link href="/success-stories" className="text-base font-light text-ink/80 hover:text-primary transition-colors">Success Stories</Link>
          </div>
        </div>

        <Link href="/" className="justify-self-center">
          <Logo imgClassName="h-12 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-4 justify-self-end min-w-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink/70 hover:bg-white hover:text-primary transition-colors"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
          <div className="hidden md:block">
            <NavDropdown label="Get Involved" items={GET_INVOLVED_LINKS} header={GET_INVOLVED_HEADER} align="right" />
          </div>
          {!isAdmin && (
            <div className="hidden sm:block">
              <DonateButton size="sm" />
            </div>
          )}
          {user ? (
            <AvatarMenu isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Link href="/login" className="hidden sm:block text-base font-light text-ink/80 hover:text-primary transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md max-h-[calc(100vh-64px)] overflow-y-auto">
          {user && (
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-background font-display">
                  {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-ink">{user.name}</p>
                {user.volunteerStatus === "approved" && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck size={11} /> Verified Volunteer</span>
                )}
              </div>
            </div>
          )}

          {/* Always-visible search pill, sits above every nav link (including About) */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                placeholder="Search cases, volunteers, stories"
                className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {mobileQuery.trim() ? (
            <div className="px-6 pb-4">
              <SearchTabs tab={mobileTab} onChange={setMobileTab} />
              <div className="mt-2 max-h-[45vh] overflow-y-auto">
                <SearchResultsList
                  tab={mobileTab}
                  cases={filteredCases}
                  volunteers={filteredVolunteers}
                  stories={filteredStories}
                  onSelectCase={(c) => { closeMobileMenu(); navigate(`/ongoing-projects?case=${c.id}`); }}
                  onSelectVolunteer={() => { closeMobileMenu(); navigate("/volunteers"); }}
                  onSelectStory={() => { closeMobileMenu(); navigate("/success-stories"); }}
                />
              </div>
            </div>
          ) : (
            <div className="px-6 py-2">
              {user && (
                <Link
                  href={isAdmin ? "/admin" : "/account"}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 py-2.5 text-sm font-semibold text-primary"
                >
                  <LayoutDashboard size={16} /> {isAdmin ? "Admin Dashboard" : "My Profile"}
                </Link>
              )}
              <Link href="/about" onClick={closeMobileMenu} className="block py-2.5 text-sm text-ink/80">About</Link>

              <button onClick={() => setMobileProjectsOpen((v) => !v)} className="w-full flex items-center justify-between py-2.5 text-sm text-ink/80">
                Projects <ChevronDown size={14} className={`transition-transform ${mobileProjectsOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileProjectsOpen && (
                <div className="pl-4 pb-1">
                  {PROJECT_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} onClick={closeMobileMenu} className="block py-2 text-sm text-ink/70">{l.label}</Link>
                  ))}
                </div>
              )}

              <Link href="/success-stories" onClick={closeMobileMenu} className="block py-2.5 text-sm text-ink/80">Success Stories</Link>

              <button onClick={() => setMobileInvolvedOpen((v) => !v)} className="w-full flex items-center justify-between py-2.5 text-sm text-ink/80">
                Get Involved <ChevronDown size={14} className={`transition-transform ${mobileInvolvedOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileInvolvedOpen && (
                <div className="pl-4 pb-1">
                  {GET_INVOLVED_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} onClick={closeMobileMenu} className="block py-2 text-sm text-ink/70">{l.label}</Link>
                  ))}
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-border">
                <Link href="/help" onClick={closeMobileMenu} className="flex items-center gap-2.5 py-2.5 text-sm text-ink/80">
                  <HelpCircle size={15} /> Help &amp; Support
                </Link>
                {user ? (
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 py-2.5 text-sm text-ink/80">
                    <LogOut size={15} /> Log Out
                  </button>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu} className="block py-2.5 text-sm font-semibold text-primary">Sign In</Link>
                )}
              </div>

              {!isAdmin && <div className="py-3"><DonateButton size="sm" /></div>}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function NavDropdown({
  label,
  items,
  header,
  align = "center",
}: {
  label: string;
  items: { label: string; desc: string; href: string; icon: typeof Briefcase }[];
  header: { icon: typeof Compass; title: string };
  align?: "center" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const HeaderIcon = header.icon;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-base font-light text-ink/80 hover:text-primary transition-colors"
        aria-expanded={open}
      >
        {label} <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className={`absolute top-full pt-3 w-80 ${
            align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
          }`}
        >
          <div className="rounded-2xl border border-border bg-white/95 backdrop-blur-md shadow-lg overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border/70">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HeaderIcon size={16} />
              </span>
              <span className="font-body text-sm font-semibold text-ink">{header.title}</span>
            </div>
            <div className="p-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-background transition-colors group"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-primary group-hover:bg-primary/10 transition-colors">
                    <item.icon size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold font-body text-ink">{item.label}</span>
                    <span className="block text-xs text-muted mt-0.5">{item.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarMenu({ isAdmin, onLogout }: { isAdmin: boolean; onLogout: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  function initials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button onClick={() => setOpen((v) => !v)} className="h-9 w-9 rounded-full overflow-hidden border-2 border-white shadow-sm">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-primary flex items-center justify-center text-background text-xs font-display">
            {initials(user.name)}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-64 rounded-2xl border border-border bg-white/95 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-semibold text-ink text-sm">{user.name}</p>
            {user.volunteerStatus === "approved" && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                <ShieldCheck size={11} /> Verified Volunteer
              </span>
            )}
          </div>
          <div className="p-2">
            <Link href={isAdmin ? "/admin" : "/account"} onClick={() => setOpen(false)} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-background transition-colors">
              <LayoutDashboard size={16} className="text-primary mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-ink">Dashboard</span>
                <span className="block text-xs text-muted">{isAdmin ? "Go to admin dashboard" : "Go to your dashboard"}</span>
              </span>
            </Link>
            {!isAdmin && (
              <Link href="/my-donations" onClick={() => setOpen(false)} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-background transition-colors">
                <Heart size={16} className="text-primary mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-ink">My Donations</span>
                  <span className="block text-xs text-muted">View your donation history</span>
                </span>
              </Link>
            )}
            <Link href="/help" onClick={() => setOpen(false)} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-background transition-colors">
              <HelpCircle size={16} className="text-primary mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-ink">Help &amp; Support</span>
                <span className="block text-xs text-muted">Get help, FAQs, and contact us</span>
              </span>
            </Link>
            <button onClick={onLogout} className="w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-background transition-colors text-left">
              <LogOut size={16} className="text-red-500 mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-ink">Log Out</span>
                <span className="block text-xs text-muted">Sign out from your account</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
