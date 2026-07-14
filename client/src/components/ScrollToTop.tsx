import { useEffect } from "react";
import { useLocation } from "wouter";

// wouter swaps route content in place without touching scroll position, so
// navigating from partway down a long page to a new page lands wherever
// the old page's scroll happened to be, instead of at the top. This resets
// scroll to the top on every route change.
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
