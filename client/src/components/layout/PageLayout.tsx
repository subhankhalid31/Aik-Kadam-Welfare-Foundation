import { useEffect, useRef, useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { TaglineBanner } from "./TaglineBanner";

// The tagline banner + navbar render together as one fixed stack pinned
// to the top of the viewport (not `sticky` — always pinned, doesn't wait
// to scroll into place). Since a fixed stack is pulled out of normal
// document flow, a spacer sized to match its real rendered height is
// inserted right after it so page content never starts underneath it.
// The height is measured live (not hardcoded) because the tagline banner
// only appears once its content loads and can be dismissed by the user,
// so the stack's height changes at runtime.
export function PageLayout({ children }: { children: React.ReactNode }) {
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
      <div ref={headerRef} className="fixed inset-x-0 top-0 z-50">
        <TaglineBanner />
        <Navbar />
      </div>
      <div style={{ height: headerHeight }} aria-hidden="true" />
      {children}
      <Footer />
    </>
  );
}
