import { createContext, useContext } from "react";

// PageLayout measures the real rendered height of its fixed header stack
// (tagline banner + navbar together, since the banner is conditional and
// dismissible, its height isn't a constant). Exposed here so anything
// that needs to position itself flush against "wherever the header
// actually ends" — like the mobile menu's backdrop and panel — reads the
// live number instead of a hardcoded pixel value that only happens to be
// right when the tagline banner is hidden.
export const HeaderHeightContext = createContext(0);

export function useHeaderHeight() {
  return useContext(HeaderHeightContext);
}
