import { useEffect } from "react";
import { useLocation } from "wouter";

// Runs at module load — before React even renders — because the browser's
// own scroll restoration on a hard reload or back/forward navigation kicks
// in immediately and can silently override a `scrollTo(0, 0)` called later
// from inside a component. Turning it off here is what actually makes "the
// page always starts at the top" hold on a real page reload, not just
// on in-app navigation.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// wouter swaps route content in place without touching scroll position, so
// navigating from partway down a long page to a new page lands wherever
// the old page's scroll happened to be, instead of at the top. This resets
// scroll to the top on every route change — and, since this effect also
// runs once on the very first render, on a fresh page load/reload too.
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
