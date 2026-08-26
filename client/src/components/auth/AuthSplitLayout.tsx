import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
// `auth-mobile-backdrop.jpg` referenced here previously didn't exist in
// the repo at all, so the "image while the video loads" fallback was
// silently broken — visitors just saw a blank/black box until the video
// decoded its first frame. Using the same hands photo the rest of the
// site already ships (attached_assets/gallery) as the poster fixes that,
// and it doubles as the true "no video present" fallback too.
import authBackdrop from "@assets/hero/postcase-hands.webp";

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
//
// Both the mobile backdrop and the desktop panel render through
// <AutoBackgroundVideo> below — see that component for how the
// "image-then-video, never a play button, never a zoom on scroll" fix
// actually works.
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

// ─────────────────────────────────────────────────────────────────────────
// Silent, controls-free, autoplaying video with a photo underneath.
//
// Fixes, in order:
//
// 1. "Play button visible on the video" — browsers only allow a muted
//    video to autoplay. Setting `muted` as a JSX attribute doesn't
//    reliably mark the underlying DOM element muted before the browser
//    evaluates the `autoplay` attribute, so autoplay can get silently
//    blocked — and when that happens the browser shows its own big play
//    button instead. We never render native `controls`, and we also set
//    `video.muted`/`video.defaultMuted` directly on the DOM node and call
//    `.play()` ourselves, so autoplay reliably succeeds and no play
//    button can appear. If a browser still refuses (very rare), we just
//    keep showing the still photo — never a broken player.
// 2. "Image until the video has loaded, then the video" — the photo is
//    always rendered first and stays fully visible until the video
//    actually has a frame ready (`onLoadedData`), then the two
//    cross-fade. No blank/black flash while the video downloads.
// 3. "Zoom in when you scroll" — this was the mobile backdrop being sized
//    with the `dvh` unit while `position: fixed`. `dvh` tracks the
//    *live* visible viewport, which grows the moment the browser's
//    address bar collapses as you start scrolling — so a `fixed` +
//    `object-cover` video sized in `dvh` visibly grows to keep covering
//    the newly-larger box, which reads exactly like a zoom-in. This
//    component itself doesn't set any viewport height unit — it just
//    fills whatever fixed-size box its parent gives it — so the parent
//    is what controls that now (see the `h-[100svh]` wrapper below).
// ─────────────────────────────────────────────────────────────────────────
function AutoBackgroundVideo({
  src,
  poster,
  className,
}: {
  src?: string;
  poster: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const video = videoRef.current;
    if (!video || !src) return;
    video.muted = true;
    video.defaultMuted = true;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Autoplay blocked outright (uncommon) — the poster photo below
        // just stays put instead of showing a broken/paused player.
      });
    }
  }, [src]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
          ready ? "opacity-0" : "opacity-100"
        )}
      />
      {src && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          disablePictureInPicture
          disableRemotePlayback
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
            ready ? "opacity-100" : "opacity-0"
          )}
        >
          <source src={src} />
        </video>
      )}
    </div>
  );
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
      {/* `top-0 left-0` + an explicit `h-[100svh]` — NOT `inset-0` sized
          with `dvh` like before — is what actually stops the zoom-on-
          scroll. `svh` is the *smallest* possible viewport height (i.e.
          it already assumes the address bar is fully visible), so unlike
          `dvh` it never changes while you scroll, so this box's size —
          and therefore the video's object-cover framing inside it —
          never visibly jumps/grows either. Worst case on a browser that
          hides its address bar is a few invisible pixels of this backdrop
          extending past the bottom of the screen, which is unnoticeable
          on a full-bleed decorative background. */}
      <div className="fixed top-0 left-0 h-[100svh] w-screen pointer-events-none lg:hidden">
        <AutoBackgroundVideo src={AUTH_VIDEO_SRC} poster={authBackdrop} />
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
          <AutoBackgroundVideo src={AUTH_VIDEO_SRC} poster={authBackdrop} />
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
