import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { inputClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";
import { ShieldCheck, Search, XCircle, MapPin, Clock, CheckCircle2 } from "lucide-react";

type VerifyResult = {
  name: string;
  badgeId: string;
  city: string | null;
  hours: number;
  casesCompleted: number;
  joined: string;
  servedUntil: string | null;
  topProjects: string[];
};

export default function VerifyPage() {
  const params = useParams<{ badgeId?: string }>();
  const [badgeId, setBadgeId] = useState(params.badgeId ?? "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!badgeId.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const data = await api.get<VerifyResult>(`/api/verify/${encodeURIComponent(badgeId.trim())}`);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Auto-search if a badge ID was passed in the URL
  useEffect(() => {
    if (params.badgeId) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageLayout>
      <main className="max-w-lg mx-auto px-6 pt-16 pb-24">
        <ShieldCheck className="text-primary" size={36} />
        <h1 className="mt-4 font-display text-3xl text-ink">Verify a Volunteer</h1>
        <p className="mt-3 text-muted leading-relaxed">
          Enter a Badge ID from a Volunteer Service Certificate to confirm it's real.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            placeholder="e.g. HH-2026-0147"
            className={`${inputClass} font-mono`}
          />
          <button type="submit" disabled={loading} className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-60">
            <Search size={16} />
          </button>
        </form>

        {searched && !loading && (
          <div className="mt-8">
            {result ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 size={18} /> Verified Volunteer
                </div>
                <h2 className="mt-3 font-display text-2xl text-ink">{result.name}</h2>
                <p className="font-mono text-sm text-muted">{result.badgeId}</p>
                {result.city && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/70"><MapPin size={13} /> {result.city}</p>
                )}
                <div className="mt-4 flex gap-8">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted"><Clock size={12} /> Hours</div>
                    <div className="font-display text-lg text-ink">{result.hours}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Cases Completed</div>
                    <div className="font-display text-lg text-ink">{result.casesCompleted}</div>
                  </div>
                </div>
                {result.topProjects.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted uppercase">Top Projects</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {result.topProjects.map((p) => (
                        <span key={p} className="text-xs rounded-full bg-white border border-emerald-200 text-primary px-2.5 py-1">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.servedUntil && <p className="mt-3 text-xs text-muted">Served until {result.servedUntil}</p>}
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-center gap-3">
                <XCircle size={20} className="text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{error || "No volunteer found with that Badge ID."}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
