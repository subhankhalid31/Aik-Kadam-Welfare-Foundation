import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
// `auth-mobile-backdrop.jpg` referenced here previously didn't exist in
// the repo at all, so the "image while the video loads" fallback was
// silently broken — visitors just saw a blank/black box until the video
// decoded its first frame. Using the same hands photo the rest of the
// site already ships (attached_assets/gallery) as the poster fixes that,
// and it doubles as the true "no video present" fallback too.
import authBackdrop from "@assets/gallery/diverse_hands_joining_together_in_unity_against_blue_sky.webp";

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
    // pattern as volunteer-register.tsx's HeroShell.
    <main className="relative overflow-x-hidden bg-background">
      {/* ── Mobile: ONE real section, not a fixed layer ──────────────────
          Previously the video/photo was `position: fixed` covering the
          whole page while the form + footer scrolled over it as a
          separate layer. That's what caused every symptom reported:
          a blank gap appearing between the backdrop and the footer once
          the page was taller than one screen (the fixed layer always
          covers exactly one viewport, no more — it doesn't grow to match
          the page), and scrolling behaving differently depending on
          whether the drag started over the video vs. over the form.
          Now the video and the sign-in form both live *inside* this one
          normal-flow section, sized with `min-h-[100svh]`. Since nothing
          here is `position: fixed` anymore, there's only ever one
          scrollable thing — the whole page — and this section (video +
          form together) scrolls up as a single block, with the footer
          starting immediately where it ends. `min-h` (not a fixed `h-`)
          rather than a fixed height is what guarantees that: it never
          traps the form in an internally-scrolling box on a short
          screen/large text size — the section just grows a little
          taller instead, and the page below still simply continues.
          `svh` (not `dvh`) is carried over from the earlier zoom-on-
          scroll fix — it's a size that's set once and never live-
          recalculates while scrolling, so there's nothing to visibly
          jump either way. */}
      <div className="relative min-h-[100svh] overflow-hidden lg:hidden">
        <AutoBackgroundVideo src={AUTH_VIDEO_SRC} poster={authBackdrop} />
        <div className="absolute inset-0 bg-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-ink/40" />

        {/* Scrim so the transparent white nav stays legible sitting on
            top of this section — scoped to this section now (not fixed
            to the whole page), since the section itself is always at
            least one screen tall. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-black/45 to-transparent" />

        {/* The actual sign-in/up form — same glass card as before, just
            now a normal-flow child of this section instead of a sibling
            layered on top of a fixed backdrop. `items-start` (not
            `items-center`) plus balanced top/bottom padding is what
            keeps a form taller than the viewport from having its top
            clipped off by a centered-but-overflowing flex box. */}
        <div className="relative z-10 flex min-h-[100svh] items-start justify-center px-6 pb-16 pt-32">{children}</div>
      </div>

      {/* ── Desktop: split layout, unchanged — the video panel here was
          always a normal-flow grid column, never `position: fixed`, so
          it never had this bug. ── */}
      <div className="relative z-10 hidden min-h-dvh lg:grid lg:grid-cols-[1.35fr_1fr]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40 bg-gradient-to-b from-black/45 to-transparent" />

        {/* ── Left: video panel + hardcoded step cards ── */}
        <div className="relative overflow-hidden">
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

        {/* ── Right: the actual form (unchanged inputs/motion) ── */}
        <div className="relative flex items-center justify-center px-8 pb-16 pt-28">{children}</div>
      </div>
    </main>
  );
}
