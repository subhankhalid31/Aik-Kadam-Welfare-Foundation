import { createContext, useContext } from "react";

// Most pages have light/white content directly behind the transparent nav
// (or the nav is scrolled and has picked up its own light backdrop), so
// dark nav text is the sensible default. Pages whose hero is a full-bleed
// dark photo (e.g. post-case.tsx) pass navTheme="light" to PageLayout so
// the nav renders white text instead — otherwise it's invisible against
// the photo.
export type NavTheme = "dark" | "light";

export const NavThemeContext = createContext<NavTheme>("dark");

export function useNavTheme() {
  return useContext(NavThemeContext);
}
