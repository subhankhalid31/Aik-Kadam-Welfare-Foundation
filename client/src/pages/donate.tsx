import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { FormField, inputClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, LogIn, Copy } from "lucide-react";
import { JazzCashLogo, EasypaisaLogo, HblLogo } from "@/components/ui/PaymentLogos";

type ApiCase = { id: string; title: string; amountNeeded: number; amountCollected: number };

type PaymentDetail = { label: string; account: string; logo?: typeof JazzCashLogo };

const PAYMENT_DETAILS: Record<"bank_transfer" | "jazzcash" | "easypaisa" | "cash", PaymentDetail> = {
  bank_transfer: { label: "Bank Transfer", account: "Aik Kadam Trust, Account #: 01607992369899, HBL", logo: HblLogo },
  jazzcash: { label: "JazzCash", account: "0313-6758644 (Subhan Khalid)", logo: JazzCashLogo },
  easypaisa: { label: "Easypaisa", account: "0313-6758644 (Subhan Khalid)", logo: EasypaisaLogo },
  cash: { label: "Cash / In Person", account: "Contact us at help@aikkadam.org to arrange a handover" },
};

export default function DonatePage() {
  const { user, loading: authLoading } = useAuth();
  const search = useSearch();

  const preselectedCaseId = new URLSearchParams(search).get("case") ?? "";

  const [cases, setCases] = useState<ApiCase[]>([]);
  const [caseId, setCaseId] = useState(preselectedCaseId);
  const [frequency, setFrequency] = useState<"one_time" | "monthly">("one_time");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<keyof typeof PAYMENT_DETAILS>("bank_transfer");
  const [senderAccount, setSenderAccount] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get<{ cases: ApiCase[] }>("/api/cases?status=ongoing").then((data) => setCases(data.cases));
  }, []);

  useEffect(() => {
    if (!caseId && cases.length > 0) setCaseId(cases[0].id);
  }, [cases, caseId]);

  const selectedCase = useMemo(() => cases.find((c) => c.id === caseId), [cases, caseId]);

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setReceipt(file);
    setReceiptPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!receipt) {
      setError("Please upload a screenshot or photo of your payment receipt");
      return;
    }
    setLoading(true);
    try {
      let recurringDonationId: string | undefined;
      if (frequency === "monthly") {
        try {
          const { pledge } = await api.post<{ pledge: { id: string } }>("/api/recurring-donations", {
            caseId,
            amount,
            method,
          });
          recurringDonationId = pledge.id;
        } catch (pledgeErr) {
          // A 409 means they already have an active pledge on this case — that's
          // fine, this payment just counts toward the existing one instead.
          if (!(pledgeErr instanceof ApiError && pledgeErr.status === 409)) throw pledgeErr;
        }
      }

      const formData = new FormData();
      formData.append("caseId", caseId);
      formData.append("amount", amount);
      formData.append("method", method);
      formData.append("senderAccount", senderAccount);
      if (referenceNote) formData.append("referenceNote", referenceNote);
      if (recurringDonationId) formData.append("recurringDonationId", recurringDonationId);
      formData.append("receipt", receipt);

      await api.postForm("/api/donations", formData);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;

  if (submitted) {
    return (
      <PageLayout>
        <main className="max-w-lg mx-auto px-6 pt-24 pb-24 text-center">
          <CheckCircle2 className="mx-auto text-primary" size={48} />
          <h1 className="mt-5 font-display text-3xl text-ink">Thank you!</h1>
          <p className="mt-3 text-muted leading-relaxed">
            Once we verify your payment against the receipt, it'll be confirmed and reflected
            on the case's progress, and you'll see it in your donation history.
            {frequency === "monthly" && " We've also set up your monthly pledge, we'll email you a reminder each month."}
          </p>
          <a href="/my-donations" className="mt-8 inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:bg-white transition-colors">
            View My Donations
          </a>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-[1fr_1.3fr] gap-10">
        {/* Left: static payment info, always visible — for people who just want to send money */}
        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">Where to Send</span>
          <h2 className="mt-2 font-display text-2xl text-ink">Send your donation to any of these.</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Send using any method below, then fill the form on the right to confirm it, no
            need to pick a method first if you just want to see where to send.
          </p>

          <div className="mt-6 space-y-3 lg:sticky lg:top-24">
            {Object.entries(PAYMENT_DETAILS).map(([key, v]) => {
              const LogoComp = v.logo;
              return (
                <div key={key} className="rounded-2xl border border-border bg-white p-4 flex items-start justify-between gap-3">
                  <div>
                    {LogoComp ? (
                      <LogoComp className="h-10 w-10 mb-1.5" />
                    ) : (
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">{v.label}</p>
                    )}
                    <p className="mt-1 text-sm text-ink/80">{v.account}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(v.account)}
                    className="shrink-0 text-primary"
                    title="Copy"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: the confirmation form — bank details on the left stay visible to everyone */}
        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">Confirm Your Donation</span>
          {!user ? (
            <>
              <h1 className="mt-2 font-display text-3xl text-ink">Sent it? Sign in to confirm.</h1>
              <p className="mt-3 text-muted leading-relaxed">
                You're welcome to send using any method on the left without an account. To
                confirm your donation and track it, sign in, this keeps every donation
                traceable to a real person and lets you see where it went afterward.
              </p>
              <a href="/login" className="glass-surface mt-6 inline-flex items-center justify-center w-full rounded-full bg-primary/65 px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors gap-2">
                <LogIn size={16} /> Sign In to Confirm
              </a>
            </>
          ) : (
            <>
              <h1 className="mt-2 font-display text-3xl text-ink">Already sent it? Let us know.</h1>
              <p className="mt-3 text-muted leading-relaxed">
                Fill this in after sending, so we can verify and apply it to the case.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <FormField label="Which case?">
              <select required value={caseId} onChange={(e) => setCaseId(e.target.value)} className={inputClass}>
                {cases.length === 0 && <option value="">No active cases right now</option>}
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </FormField>

            {selectedCase && (
              <p className="text-xs text-muted -mt-2">
                PKR {selectedCase.amountCollected.toLocaleString()} raised of {selectedCase.amountNeeded.toLocaleString()} goal
              </p>
            )}

            <FormField label="How often?">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency("one_time")}
                  className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    frequency === "one_time" ? "bg-primary text-background border-primary" : "bg-white text-ink border-border hover:bg-background"
                  }`}
                >
                  One-time
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("monthly")}
                  className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    frequency === "monthly" ? "bg-primary text-background border-primary" : "bg-white text-ink border-border hover:bg-background"
                  }`}
                >
                  Monthly
                </button>
              </div>
              {frequency === "monthly" && (
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  We'll set up a monthly pledge and email you a reminder each month, you'll still send and confirm each
                  month's payment yourself, just like a one-time donation. Pause or cancel any time from My Donations.
                </p>
              )}
            </FormField>

            <FormField label="Amount (Rs.)">
              <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} onWheel={(e) => e.currentTarget.blur()} className={inputClass} placeholder="0" />
            </FormField>

            <FormField label="Payment method">
              <select value={method} onChange={(e) => setMethod(e.target.value as keyof typeof PAYMENT_DETAILS)} className={inputClass}>
                {Object.entries(PAYMENT_DETAILS).map(([key, v]) => (
                  <option key={key} value={key}>{v.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Your account / phone number (the one you sent the payment from)">
              <input required minLength={4} type="text" value={senderAccount} onChange={(e) => setSenderAccount(e.target.value)} className={inputClass} placeholder="e.g. 0301-2345678" />
            </FormField>

            <FormField label="Payment receipt (screenshot or photo), required">
              <input required type="file" accept="image/*" onChange={handleReceiptChange} className={`${inputClass} py-2`} />
              {receiptPreview && (
                <img src={receiptPreview} alt="Receipt preview" className="mt-3 h-40 w-full object-contain rounded-lg border border-border bg-white" />
              )}
            </FormField>

            <FormField label="Transaction ID / reference (optional, helps us confirm faster)">
              <input type="text" value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} className={inputClass} placeholder="e.g. TRX123456" />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading || !caseId} className="glass-surface w-full rounded-full bg-accent/65 px-7 py-3.5 font-semibold text-ink hover:bg-accent-dark transition-colors disabled:opacity-60">
              {loading ? "Submitting..." : frequency === "monthly" ? "I've Sent This Month's Payment" : "I've Sent the Payment"}
            </button>
          </form>
            </>
          )}
        </div>
      </main>

    </PageLayout>
  );
}
