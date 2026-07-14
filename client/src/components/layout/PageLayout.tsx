import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { TaglineBanner } from "./TaglineBanner";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TaglineBanner />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
