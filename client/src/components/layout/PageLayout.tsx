import { useEffect, useRef, useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { TaglineBanner } from "./TaglineBanner";
import { HeaderHeightContext } from "@/lib/header-height-context";
import { NavThemeContext, type NavTheme } from "@/lib/nav-theme-context";

// The tagline banner + navbar render together as one fixed stack pinned
// to the top of the viewport (not `sticky` — always pinned, doesn't wait
// to scroll into place). Since a fixed stack is pulled out of normal
// document flow, a spacer sized to match its real rendered height is
// inserted right after it so page content never starts underneath it.
// The height is measured live (not hardcoded) because the tagline banner
// only appears once its content loads and can be dismissed by the user,
// so the stack's height changes at runtime.
// The tagline banner + navbar render together as one fixed stack pinned
// to the top of the viewport (not `sticky` — always pinned, doesn't wait
// to scroll into place).
//
// By default, a spacer sized to match the stack's real rendered height is
// inserted right after it so page content never starts underneath it —
// the right behaviour for ordinary pages. Pass `transparentHero` for a
// page whose very first section is a full-bleed image meant to be seen
// *through* the transparent nav (the homepage hero): that skips the
// spacer entirely, so the page's content starts at true y=0 and the
// image is genuinely visible behind the nav instead of the nav just
// floating over empty page background that looks solid by coincidence.
export function PageLayout({
  children,
  transparentHero = false,
  navTheme = "dark",
}: {
  children: React.ReactNode;
  transparentHero?: boolean;
  navTheme?: NavTheme;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const updateHeight = () => setHeaderHeight(el.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <HeaderHeightContext.Provider value={headerHeight}>
        <NavThemeContext.Provider value={navTheme}>
          <div ref={headerRef} className="fixed inset-x-0 top-0 z-50">
            <TaglineBanner />
            <Navbar />
          </div>
        </NavThemeContext.Provider>
      </HeaderHeightContext.Provider>
      {!transparentHero && <div style={{ height: headerHeight }} aria-hidden="true" />}
      {children}
      <Footer />
    </>
  );
}
