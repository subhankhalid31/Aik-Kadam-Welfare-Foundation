import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";
import {
  UserCheck,
  FileText,
  Briefcase,
  Wallet,
  Users,
  Image as ImageIcon,
  Heart,
  LogOut,
  Camera,
  Clock4,
  ShieldOff,
  BarChart3,
  Plus,
  UserCog,
  FolderKanban,
  Repeat,
  Mail,
  Menu,
  X,
  Newspaper,
  Gift,
  Star,
} from "lucide-react";

export type AdminTabKey =
  | "volunteers"
  | "cases"
  | "ongoing"
  | "donations"
  | "recurring"
  | "approved"
  | "gallery"
  | "stories"
  | "blogs"
  | "donorCarousel"
  | "volunteerCarousel"
  | "users"
  | "summary"
  | "namechange"
  | "hidden"
  | "rejected"
  | "inboxContact"
  | "inboxPartnership";

// Sub-tabs shown as capsule pills inside "Volunteer Services".
export const VOLUNTEER_SUBTABS: { key: AdminTabKey; label: string }[] = [
  { key: "approved", label: "All Volunteers" },
  { key: "volunteers", label: "Pending Volunteers" },
  { key: "namechange", label: "Name Change Requests" },
];

// Sub-tabs shown as capsule pills inside "Projects".
export const PROJECT_SUBTABS: { key: AdminTabKey; label: string }[] = [
  { key: "cases", label: "Pending Cases" },
  { key: "ongoing", label: "Manage Ongoing Cases" },
  { key: "gallery", label: "Completed Projects" },
  { key: "rejected", label: "Rejected Cases" },
  { key: "hidden", label: "Hidden Cases" },
];

// Sub-tabs shown as capsule pills inside "Inbox".
export const INBOX_SUBTABS: { key: AdminTabKey; label: string }[] = [
  { key: "inboxContact", label: "Contact Emails" },
  { key: "inboxPartnership", label: "Partnership Emails" },
];

type NavEntry =
  | { type: "link"; label: string; icon: typeof UserCheck; href: string }
  | { type: "tab"; label: string; icon: typeof UserCheck; key: AdminTabKey; group?: AdminTabKey[] };

const NAV_ITEMS: NavEntry[] = [
  { type: "link", label: "Submit a Case", icon: Plus, href: "/post-case" },
  { type: "tab", label: "Volunteer Services", icon: UserCog, key: "approved", group: VOLUNTEER_SUBTABS.map((t) => t.key) },
  { type: "tab", label: "Projects", icon: FolderKanban, key: "cases", group: PROJECT_SUBTABS.map((t) => t.key) },
  { type: "tab", label: "Inbox", icon: Mail, key: "inboxContact", group: INBOX_SUBTABS.map((t) => t.key) },
  { type: "tab", label: "Donations", icon: Wallet, key: "donations" },
  { type: "tab", label: "Monthly Pledges", icon: Repeat, key: "recurring" },
  { type: "tab", label: "Donor Carousel", icon: Star, key: "donorCarousel" },
  { type: "tab", label: "Volunteer Carousel", icon: Users, key: "volunteerCarousel" },
  { type: "tab", label: "Success Stories", icon: Heart, key: "stories" },
  { type: "tab", label: "Blog", icon: Newspaper, key: "blogs" },
  { type: "tab", label: "All Users", icon: ShieldOff, key: "users" },
  { type: "tab", label: "Daily Summary", icon: BarChart3, key: "summary" },
];

type Stats = { totalRaised: number; totalTips: number; totalDonors: number; activeCases: number; pendingApprovals: number };

export function AdminLayout({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
  children: React.ReactNode;
}) {
  const { user, logout, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<Stats>("/api/admin/stats").then(setStats);
  }, [activeTab]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const file = await compressImage(raw);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.postForm("/api/account/avatar", formData);
      await refresh();
    } finally {
      setUploading(false);
    }
  }

  function initials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="min-h-screen lg:h-screen lg:flex lg:overflow-hidden bg-background">
      {/* Mobile top bar: hamburger + title, only shown below lg */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open admin menu"
          className="glass-surface glass-surface-outline h-9 w-9 rounded-lg border flex items-center justify-center text-ink shrink-0"
        >
          <Menu size={18} />
        </button>
        <span className="font-display text-base font-semibold text-primary">Aik Kadam Admin</span>
      </div>

      {/* Backdrop, mobile only, closes the sidebar on tap */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Left sidebar: slide-over drawer on mobile, static column on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-border bg-white flex flex-col transition-transform duration-200 lg:static lg:h-screen lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <span className="font-display text-lg font-semibold text-primary">Aik Kadam</span>
            <p className="text-xs text-muted mt-0.5">Admin Dashboard</p>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close admin menu"
            className="glass-surface glass-surface-outline lg:hidden h-8 w-8 rounded-lg border flex items-center justify-center text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            if (item.type === "link") {
              return (
                <button
                  key={item.href}
                  onClick={() => { navigate(item.href); setMobileNavOpen(false); }}
                  className="glass-surface w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors mb-2"
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            }
            const active = item.group ? item.group.includes(activeTab) : activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { onTabChange(item.key); setMobileNavOpen(false); }}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-background" : "text-ink/75 hover:bg-background"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden group"
                title="Change profile photo"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-primary flex items-center justify-center text-background text-sm font-display">
                    {initials(user.name)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={14} className="text-white" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            {uploading && <p className="mt-1.5 text-xs text-muted">Uploading...</p>}
            <button
              onClick={handleLogout}
              className="glass-surface glass-surface-outline mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold text-ink hover:bg-background transition-colors"
            >
              <LogOut size={13} /> Log Out
            </button>
          </div>
        )}
      </aside>

      {/* Center content */}
      <main className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto p-8">{children}</main>

      {/* Right stats panel */}
      <aside className="w-72 shrink-0 bg-primary p-6 hidden lg:block lg:h-screen lg:overflow-y-auto">
        <h2 className="font-display text-lg text-background">Overview</h2>
        <div className="mt-6 space-y-4">
          {stats ? (
            <>
              <StatCard icon={Wallet} label="Total Raised" value={`PKR ${stats.totalRaised.toLocaleString()}`} />
              <StatCard icon={Users} label="Total Donors" value={stats.totalDonors} />
              <StatCard icon={Briefcase} label="Active Cases" value={stats.activeCases} />
              <StatCard icon={Clock4} label="Pending Approvals" value={stats.pendingApprovals} />
              {/* Sum of every tip ever confirmed, across every case — kept
                  as its own card since tips never count toward any case's
                  own collected total (see confirmDonation on the server). */}
              <StatCard icon={Gift} label="Total Tips Collected" value={`PKR ${stats.totalTips.toLocaleString()}`} />
            </>
          ) : (
            <p className="text-background/70 text-sm">Loading...</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-200 hover:bg-white/15">
      <Icon size={16} className="text-background/80" />
      <div className="mt-2 font-display text-xl text-background">{value}</div>
      <div className="text-xs text-background/70">{label}</div>
    </div>
  );
}

// Capsule/pill sub-navigation used inside Volunteer Services and Projects.
export function PillTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: AdminTabKey; label: string }[];
  active: AdminTabKey;
  onChange: (key: AdminTabKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            active === t.key ? "bg-primary text-background" : "bg-white border border-border text-ink/70 hover:bg-background"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
