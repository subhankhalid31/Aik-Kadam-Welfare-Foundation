import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";
import { Camera, ArrowLeft } from "lucide-react";

export default function AccountSettingsPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (authLoading) return null;
  if (!user) {
    navigate("/login");
    return null;
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

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneMsg("");
    setPhoneLoading(true);
    try {
      await api.patch("/api/account/phone", { phone });
      setPhoneMsg("Phone number updated.");
    } catch (err) {
      setPhoneMsg(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNameLoading(true);
    try {
      await api.post("/api/account/request-name-change", { newName });
      setNameMsg("Request submitted, an admin will review it.");
      setNewName("");
    } catch (err) {
      setNameMsg(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");
    setPasswordLoading(true);
    try {
      await api.post("/api/account/change-password", { currentPassword, newPassword });
      setPasswordMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setPasswordLoading(false);
    }
  }

  function initials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <PageLayout>
      <main className="max-w-lg mx-auto px-6 pt-16 pb-24">
        <a href="/account" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Back to Account
        </a>
        <h1 className="mt-3 font-display text-3xl text-ink">Settings</h1>

        {/* Profile picture */}
        <div className="mt-8">
          <h2 className="font-display text-lg text-ink">Profile Picture</h2>
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative h-16 w-16 rounded-full overflow-hidden group"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary flex items-center justify-center font-display text-lg text-background">
                  {initials(user.name)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={16} className="text-white" />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-primary">
              {uploading ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>

        {/* Phone number */}
        <form onSubmit={handlePhoneSubmit} className="mt-8">
          <h2 className="font-display text-lg text-ink">Phone Number</h2>
          <p className="text-sm text-muted mt-1">
            {user.volunteerCategory ? "Used for volunteer coordination." : "Used for account contact."}
          </p>
          <div className="mt-3 flex gap-2">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+92 3XX XXXXXXX" />
            <div className="glass-pill-wrap shrink-0">
              <button type="submit" disabled={phoneLoading} className="glass-pill relative isolate rounded-full block">
                <span className="glass-pill-text block px-5 py-2.5 text-sm font-semibold">Save</span>
              </button>
              <div className="glass-pill-shadow rounded-full" />
            </div>
          </div>
          {phoneMsg && <p className="mt-2 text-sm text-muted">{phoneMsg}</p>}
        </form>

        {/* Name change request */}
        <form onSubmit={handleNameSubmit} className="mt-8">
          <h2 className="font-display text-lg text-ink">Change Name</h2>
          <p className="text-sm text-muted mt-1">
            Your name and Badge ID can't be edited directly to protect the integrity of volunteer
            records, a request goes to admin for review instead.
          </p>
          {user.pendingNameChange && (
            <div className="mt-2 rounded-lg bg-accent/10 border border-accent/30 p-3 text-sm text-ink/80">
              Pending request: "{user.pendingNameChange}", awaiting admin approval.
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} placeholder="Requested new name" />
            <div className="glass-pill-wrap shrink-0">
              <button type="submit" disabled={nameLoading || !newName} className="glass-pill relative isolate rounded-full block">
                <span className="glass-pill-text block px-5 py-2.5 text-sm font-semibold">Request</span>
              </button>
              <div className="glass-pill-shadow rounded-full" />
            </div>
          </div>
          {nameMsg && <p className="mt-2 text-sm text-muted">{nameMsg}</p>}
        </form>

        {/* Password */}
        <form onSubmit={handlePasswordSubmit} className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Change Password</h2>
            <a href="/forgot-password" className="text-xs font-semibold text-primary">Forgot password?</a>
          </div>
          <div className="mt-3 space-y-3">
            <FormField label="Current password">
              <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="New password">
              <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="At least 8 characters" />
            </FormField>
          </div>
          {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
          {passwordMsg && <p className="mt-2 text-sm text-primary">{passwordMsg}</p>}
          <div className="glass-pill-wrap mt-3 inline-block">
            <button type="submit" disabled={passwordLoading} className="glass-pill relative isolate rounded-full block">
              <span className="glass-pill-text block px-5 py-2.5 text-sm font-semibold">Update Password</span>
            </button>
            <div className="glass-pill-shadow rounded-full" />
          </div>
        </form>
      </main>
    </PageLayout>
  );
}
