import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, LayoutDashboard, ChevronDown, ChevronRight, Heart, HelpCircle, LogOut, LogIn, Star,
  Briefcase, Image as ImageIcon, Map, Users, Handshake, ShieldCheck, Search,
  Compass, HeartHandshake,
} from "lucide-react";
import { Logo } from "./Logo";
import { ArrowCta } from "@/components/ui/ArrowCta";
import { useGlobalSearch, type SearchTab } from "@/hooks/useGlobalSearch";
import { SearchTabs, SearchResultsList } from "@/components/ui/SearchResults";
import { useAuth } from "@/lib/auth-context";
import { useHeaderHeight } from "@/lib/header-height-context";
import { useNavTheme } from "@/lib/nav-theme-context";

const PROJECT_LINKS = [
  { label: "Ongoing Projects", desc: "See active cases in progress", href: "/ongoing-projects", icon: Briefcase },
  { label: "Completed Projects", desc: "Browse projects we've finished", href: "/completed-projects", icon: ImageIcon },
  { label: "Project Map", desc: "View every location on a map", href: "/project-map", icon: Map },
];

const PROJECTS_HEADER = { icon: Compass, title: "Explore our projects" };

const GET_INVOLVED_LINKS = [
  { label: "Volunteers", desc: "Meet our volunteer community", href: "/volunteers", icon: Users },
  { label: "Partner With Us", desc: "Explore partnership opportunities", href: "/partner", icon: Handshake },
  { label: "Contact", desc: "Get in touch with us", href: "/contact", icon: HelpCircle },
];

const GET_INVOLVED_HEADER = { icon: HeartHandshake, title: "Ways to get involved" };

const menuVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

// Shared row styling for every plain (non-accordion) mobile menu link — an
// icon, the label, and a chevron that only appears on hover/press as a
// "this goes somewhere" affordance, plus a soft rounded hover fill instead
// of the flat underline-free rows the menu used before.
function MobileNavRow({
  href,
  icon: Icon,
  children,
  onClick,
  tone = "default",
}: {
  href: string;
  icon: typeof User;
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "default" | "brand" | "danger";
}) {
  const toneClasses =
    tone === "brand"
      ? "text-brand-green hover:bg-brand-green/10"
      : tone === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-ink/85 hover:bg-brand-green/8 hover:text-ink";

  return (
    <motion.div variants={menuItemVariants}>
      <Link
        href={href}
        onClick={onClick}
        className={`group/row flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${toneClasses}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60">
          <Icon size={15} />
        </span>
        <span className="flex-1">{children}</span>
        <ChevronRight size={15} className="opacity-0 -translate-x-1 transition-all duration-200 group-hover/row:opacity-60 group-hover/row:translate-x-0" />
      </Link>
    </motion.div>
  );
}

export function Navbar() {
  const headerHeight = useHeaderHeight();
  const navTheme = useNavTheme();
  const linkColor = navTheme === "light" ? "text-white/90 hover:text-white" : "text-ink/80 hover:text-brand-green";
  const iconColor = navTheme === "light" ? "text-white" : "text-ink";
  const [open, setOpen] = useState(false);
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
    <>
    <header
      className={`transition-all duration-300 ${
        scrolled
          ? navTheme === "light"
            ? "bg-ink/55 backdrop-blur-md border-b border-white/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]"
            : "bg-background/25 backdrop-blur-md border-b border-border/60 shadow-[0_4px_20px_-4px_rgba(10,12,16,0.06)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Logo + nav links clustered left, actions clustered right */}
      <nav className="max-w-7xl mx-auto h-[76px] flex items-center justify-between gap-4 px-5 sm:px-6">
        <div className="flex items-center gap-6 min-w-0 md:hidden">
          <button
            className={`group md:hidden shrink-0 -ml-1 p-1 ${iconColor}`}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <svg
              className="pointer-events-none"
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 12L20 12"
                className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
              />
              <path
                d="M4 12H20"
                className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
              />
              <path
                d="M4 12H20"
                className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
              />
            </svg>
          </button>
        </div>

        <Link href="/" className="shrink-0 md:hidden">
          <Logo imgClassName="h-6 sm:h-7 w-auto object-contain -mt-1.5" variant={navTheme} />
        </Link>

        <div className="hidden md:flex items-center gap-6 min-w-0">
          <Link href="/" className="shrink-0">
            <Logo imgClassName="h-6 sm:h-7 w-auto object-contain -mt-1.5" variant={navTheme} />
          </Link>
          <div className="flex items-center gap-9">
            <Link href="/about" className={`text-sm font-medium transition-colors ${linkColor}`}>About</Link>
            <NavDropdown label="Projects" items={PROJECT_LINKS} header={PROJECTS_HEADER} triggerClassName={linkColor} />
            <Link href="/success-stories" className={`text-sm font-medium transition-colors ${linkColor}`}>Success Stories</Link>
            <NavDropdown label="Get Involved" items={GET_INVOLVED_LINKS} header={GET_INVOLVED_HEADER} triggerClassName={linkColor} />
          </div>
        </div>

        <div className="flex items-center gap-5 justify-self-end min-w-0">
          {!isAdmin && (
            <div className="hidden sm:block">
              <ArrowCta href="/donate" variant={scrolled ? "ivory" : "ink"} shape="square" size="sm" sheen sheenMode="continuous" animateArrow className="pl-6 pr-5">Donate Now</ArrowCta>
            </div>
          )}
          {user ? (
            <AvatarMenu isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <Link href="/login" className={`hidden sm:inline-block text-sm font-medium transition-colors ${linkColor}`}>
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>

      {/* The mobile menu's backdrop + panel render as a SIBLING of
          <header>, not nested inside it. Reason: when scrolled, <header>
          gets its own `backdrop-blur-md`, and `backdrop-filter` on an
          ancestor creates a new containing block for `position: fixed`
          descendants (same rule as `transform`/`filter`/`perspective`).
          With the menu nested inside <header>, that meant its "fixed"
          backdrop was actually positioned relative to the ~76px-tall
          header instead of the viewport the moment the page was scrolled
          — which is exactly why the blur only worked at the very top of
          the page and silently broke on scroll. Keeping it outside
          <header> means it's never affected by the header's own filter,
          no matter the scroll position. */}
      <AnimatePresence>
        {open && (
          <>
            {/* Blurred (not dimmed) backdrop — click anywhere outside the
                panel to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-x-0 bottom-0 backdrop-blur-sm bg-white/5 z-40"
              style={{ top: headerHeight }}
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            {/* Floating panel — flush against the left edge and the
                underside of the navbar, so the top-left corner stays
                square (it's attached to the nav's own corner, not
                floating free). Top-right and bottom-right are rounded
                since those are the panel's actual free edges. */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
              className="md:hidden fixed left-0 z-50 w-[80vw] max-w-[300px] overflow-y-auto rounded-tr-2xl rounded-br-2xl border border-border bg-background shadow-2xl"
              style={{ top: headerHeight, maxHeight: `calc(100vh - ${headerHeight}px - 16px)` }}
            >
            {user && (
              <motion.div variants={menuItemVariants} className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-brand-green flex items-center justify-center text-background font-display">
                    {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                  {user.volunteerStatus === "approved" && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck size={11} /> Verified Volunteer</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Always-visible search pill, sits above every nav link (including About) */}
            <motion.div variants={menuItemVariants} className="px-4 pt-3.5 pb-2">
              <div className="glass-input-wrap w-full">
                <div className="glass-input">
                  <span className="glass-input-text-area" />
                  <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                    <Search size={16} className="text-ink/60" />
                  </div>
                  <input
                    value={mobileQuery}
                    onChange={(e) => setMobileQuery(e.target.value)}
                    placeholder="Search cases, volunteers, stories"
                    className="relative z-10 h-full w-0 flex-grow bg-transparent text-sm text-ink placeholder:text-ink/45 focus:outline-none py-2.5 pr-4"
                  />
                </div>
              </div>
            </motion.div>

            {mobileQuery.trim() ? (
              <motion.div variants={menuItemVariants} className="px-4 pb-4">
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
              </motion.div>
            ) : (
              <div className="px-4 py-2 space-y-0.5">
                {user && (
                  <MobileNavRow href={isAdmin ? "/admin" : "/account"} icon={LayoutDashboard} onClick={closeMobileMenu} tone="brand">
                    {isAdmin ? "Admin Dashboard" : "My Profile"}
                  </MobileNavRow>
                )}

                <MobileNavRow href="/about" icon={User} onClick={closeMobileMenu}>About</MobileNavRow>

                <motion.div variants={menuItemVariants}>
                  <button
                    onClick={() => setMobileProjectsOpen((v) => !v)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/85 hover:bg-brand-green/8 transition-colors"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60">
                      <Briefcase size={15} />
                    </span>
                    <span className="flex-1 text-left">Projects</span>
                    <ChevronDown size={15} className={`transition-transform ${mobileProjectsOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {mobileProjectsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-11"
                      >
                        {PROJECT_LINKS.map((l) => (
                          <Link key={l.href} href={l.href} onClick={closeMobileMenu} className="block py-2 text-sm text-ink/65 hover:text-brand-green transition-colors">{l.label}</Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <MobileNavRow href="/success-stories" icon={Star} onClick={closeMobileMenu}>Success Stories</MobileNavRow>

                <motion.div variants={menuItemVariants}>
                  <button
                    onClick={() => setMobileInvolvedOpen((v) => !v)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/85 hover:bg-brand-green/8 transition-colors"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60">
                      <HeartHandshake size={15} />
                    </span>
                    <span className="flex-1 text-left">Get Involved</span>
                    <ChevronDown size={15} className={`transition-transform ${mobileInvolvedOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {mobileInvolvedOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-11"
                      >
                        {GET_INVOLVED_LINKS.map((l) => (
                          <Link key={l.href} href={l.href} onClick={closeMobileMenu} className="block py-2 text-sm text-ink/65 hover:text-brand-green transition-colors">{l.label}</Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Separator before the account-level actions, same grouping
                    as before, just visually distinct now via spacing + a
                    hairline rather than sitting flush with the nav links. */}
                <motion.div variants={menuItemVariants} className="!mt-3 pt-2 border-t border-border space-y-0.5">
                  <MobileNavRow href="/help" icon={HelpCircle} onClick={closeMobileMenu}>Help &amp; Support</MobileNavRow>
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <LogOut size={15} />
                      </span>
                      <span className="flex-1 text-left">Log Out</span>
                    </button>
                  ) : (
                    <MobileNavRow href="/login" icon={LogIn} onClick={closeMobileMenu} tone="brand">Sign In</MobileNavRow>
                  )}
                </motion.div>

                {!isAdmin && (
                  <motion.div variants={menuItemVariants} className="px-3 py-3">
                    <ArrowCta href="/donate" variant="ink" shape="square" size="sm" sheen sheenMode="continuous">Donate Now</ArrowCta>
                  </motion.div>
                )}
              </div>
            )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavDropdown({
  label,
  items,
  header,
  align = "center",
  triggerClassName = "text-ink/80 hover:text-brand-green",
}: {
  label: string;
  items: { label: string; desc: string; href: string; icon: typeof Briefcase }[];
  header: { icon: typeof Compass; title: string };
  align?: "center" | "right";
  triggerClassName?: string;
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
        className={`flex items-center gap-1 text-sm font-medium transition-colors ${triggerClassName}`}
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
          <div className="glass-panel rounded-2xl overflow-hidden" style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(252, 250, 246, 0.95)" }}>
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
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
                  className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-white/60 transition-colors group"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-brand-green group-hover:bg-brand-green/10 transition-colors">
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
      <button onClick={() => setOpen((v) => !v)} className="glass-surface h-9 w-9 rounded-full overflow-hidden transition-transform duration-200 hover:scale-105">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-brand-green flex items-center justify-center text-background text-xs font-display">
            {initials(user.name)}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-64 glass-panel rounded-2xl overflow-hidden" style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(252, 250, 246, 0.95)" }}>
          <div className="px-4 py-3 border-b border-white/50">
            <p className="font-semibold text-ink text-sm">{user.name}</p>
            {user.volunteerStatus === "approved" && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                <ShieldCheck size={11} /> Verified Volunteer
              </span>
            )}
          </div>
          <div className="p-2">
            <Link href={isAdmin ? "/admin" : "/account"} onClick={() => setOpen(false)} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/60 transition-colors">
              <LayoutDashboard size={16} className="text-brand-green mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-ink">Dashboard</span>
                <span className="block text-xs text-muted">{isAdmin ? "Go to admin dashboard" : "Go to your dashboard"}</span>
              </span>
            </Link>
            {!isAdmin && (
              <Link href="/my-donations" onClick={() => setOpen(false)} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/60 transition-colors">
                <Heart size={16} className="text-brand-green mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-ink">My Donations</span>
                  <span className="block text-xs text-muted">View your donation history</span>
                </span>
              </Link>
            )}
            <Link href="/help" onClick={() => setOpen(false)} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/60 transition-colors">
              <HelpCircle size={16} className="text-brand-green mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-ink">Help &amp; Support</span>
                <span className="block text-xs text-muted">Get help, FAQs, and contact us</span>
              </span>
            </Link>
            <button onClick={onLogout} className="w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/60 transition-colors text-left">
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
