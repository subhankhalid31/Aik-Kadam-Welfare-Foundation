import { motion } from "framer-motion";
import mobileBackdrop from "@assets/hero/auth-mobile-backdrop.jpg";

// ─────────────────────────────────────────────────────────────────────────
// Shared visual frame for login / signup / forgot-password.
//
// Replaces the old per-page CanvasRevealEffect particle field (removed —
// it was a constantly-animating canvas running behind every one of these
// pages, which was the actual source of the slowness). Desktop gets a
// split layout: the looping video on the left with hardcoded "step" cards
// over it, and the real form on the right. Mobile plays that same video
// full-bleed behind the form instead, falling back to a still photo if no
// video has been added yet.
//
// VIDEO: drop an .mp4/.webm/.mov into client/src/assets/auth-video/ and it
// plays automatically on both desktop and mobile — see the README in that
// folder. Nothing to wire up here.
// ─────────────────────────────────────────────────────────────────────────

// Vite glob-imports whatever video file(s) live in that folder at build
// time. First match (alphabetical) wins so multiple files don't fight —
// see the README for naming if you want to control which one plays.
const videoModules = import.meta.glob<{ default: string }>("/src/assets/auth-video/*.{mp4,webm,mov,MP4,WEBM,MOV}", { eager: true });
const AUTH_VIDEO_SRC = Object.keys(videoModules)
  .sort()
  .map((key) => videoModules[key].default)[0];

export interface AuthStep {
  title: string;
  description: string;
}

export function AuthSplitLayout({
  eyebrow,
  heading,
  subheading,
  steps,
  children,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  subheading: string;
  steps: AuthStep[];
  children: React.ReactNode;
}) {
  return (
    // `transparentHero navTheme="light"` on the page's PageLayout call makes
    // the nav render with no background of its own and white text/logo, so
    // this main needs to run full-bleed behind it (no top spacer) — same
    // pattern as volunteer-register.tsx's HeroShell. `min-h-dvh` (dynamic
    // viewport height, not the old plain `100vh`) is what actually fixes
    // the "gap above the footer" / scroll-jump bug on mobile: `100vh`
    // includes the space the browser's address bar covers even while
    // it's visible, so as that bar shows/hides during a scroll gesture,
    // a plain-`vh` box doesn't match the real visible viewport and a
    // sliver of the page underneath peeks through right at the
    // boundary. `dvh` tracks the actual visible height instead, so
    // there's nothing to peek through in the first place.
    // `overflow-x-hidden` (not `overflow-hidden`) so tall content can
    // grow/scroll normally instead of having its top clipped off — that
    // was the earlier "screen box going out" bug: with `overflow-hidden`
    // + a vertically-centered card taller than the viewport, the
    // centering pushed the top of the card above y=0 and it just
    // vanished.
    <main className="relative min-h-dvh overflow-x-hidden bg-background">
      {/* Mobile backdrop — same video as the desktop panel when one's been
          dropped into client/src/assets/auth-video/, falling back to the
          still photo if that folder's empty. Darkened ~25% and softly
          blurred either way so the glass inputs stay readable sitting
          directly on top of it.
          `pointer-events-none` is the fix for "scrolling only drags the
          background instead of the page" — this div (and the <video> in
          particular) is purely decorative, but without this a touch-drag
          that starts on top of the video could get captured by the video
          element itself on some mobile browsers instead of scrolling the
          page underneath it. */}
      <div className="fixed inset-0 pointer-events-none lg:hidden">
        {AUTH_VIDEO_SRC ? (
          <video autoPlay loop muted playsInline poster={mobileBackdrop} className="h-full w-full scale-105 object-cover blur-[3px]">
            <source src={AUTH_VIDEO_SRC} />
          </video>
        ) : (
          <img src={mobileBackdrop} alt="" aria-hidden="true" className="h-full w-full scale-105 object-cover blur-[3px]" />
        )}
        <div className="absolute inset-0 bg-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-ink/40" />
      </div>

      {/* Full-width scrim so the transparent white nav stays legible over
          BOTH columns — the video panel is already dark enough on its own,
          but without this the nav's white logo/links would sit directly on
          the plain light form column with no contrast at the top of the
          page (before the user scrolls and the nav picks up its own
          backdrop). Pointer-events-none so it never blocks clicks. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-black/45 to-transparent lg:absolute lg:h-40" />

      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[1.35fr_1fr]">
        {/* ── Left: video panel + hardcoded step cards (desktop only) ── */}
        <div className="relative hidden overflow-hidden lg:block">
          {AUTH_VIDEO_SRC ? (
            <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
              <source src={AUTH_VIDEO_SRC} />
            </video>
          ) : (
            // Falls back to a plain brand gradient — no particles, no
            // animation loop — if no video has been dropped in yet.
            <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-brand-green" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/45" />

          {/* pt-32/pt-36 clears the transparent nav sitting on top of this
              panel — without it "SIGN IN" / the heading would start right
              underneath the logo. */}
          <div className="relative z-10 flex h-full flex-col justify-between px-10 pb-10 pt-32 xl:px-14 xl:pb-14 xl:pt-36">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{eyebrow}</span>
              <h2 className="mt-4 max-w-md font-display text-4xl font-bold leading-[1.1] text-white xl:text-5xl">{heading}</h2>
              <p className="mt-4 max-w-sm text-base text-white/75">{subheading}</p>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.12, ease: "easeOut" }}
                  className="flex items-start gap-4 rounded-2xl border border-white/25 bg-white/10 px-5 py-4 backdrop-blur-md"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/70">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: the actual form (unchanged inputs/motion) ──
            `items-start` (not `items-center`) is the actual fix for the
            mobile clipping bug — see the note on `main` above. Padding does
            the visual centering instead: pt-32 clears the transparent nav,
            pb-16 balances it out underneath. */}
        <div className="relative flex items-start justify-center px-6 pb-16 pt-32 lg:items-center lg:px-8 lg:pb-16 lg:pt-28">{children}</div>
      </div>
    </main>
  );
}
