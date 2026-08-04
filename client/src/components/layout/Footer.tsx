import { Link } from "wouter";
import { FlutedGlass } from "@paper-design/shaders-react";
import { Logo } from "./Logo";
import { Instagram, Facebook } from "lucide-react";

const companyName = "Aik Kadam";

const SOCIAL_LINKS = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/aikkadam" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/aikadam" },
];

// Same 3-column {title, links[]} shape as the reference footer, populated
// with this site's real, working routes instead of placeholder content.
const footerLinks = [
  {
    title: "Explore",
    links: [
      { name: "About", href: "/about" },
      { name: "Ongoing Projects", href: "/ongoing-projects" },
      { name: "Completed Projects", href: "/completed-projects" },
      { name: "Success Stories", href: "/success-stories" },
      { name: "Project Map", href: "/project-map" },
    ],
  },
  {
    title: "Get Involved",
    links: [
      { name: "Volunteers", href: "/volunteers" },
      { name: "Partner With Us", href: "/partner" },
      { name: "Submit a Case", href: "/post-case" },
      { name: "Donate Now", href: "/donate" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Sign In", href: "/login" },
      { name: "Create Account", href: "/signup" },
      { name: "My Donations", href: "/my-donations" },
      { name: "Verify a Badge", href: "/verify" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-background relative overflow-hidden antialiased [font-synthesis:none]">
      {/* Large stroke-text brand name */}
      <div className="relative w-full flex justify-center items-end pt-10 sm:pt-16 md:pt-24 lg:pt-32 pb-0 z-0">
        <h1 className="text-[42px] sm:text-[80px] md:text-[130px] lg:text-[170px] font-shout font-extrabold text-transparent [-webkit-text-stroke:1px_rgba(21,21,21,0.4)] leading-[0.75] select-none -mb-2 sm:-mb-4 md:-mb-6 opacity-50 whitespace-nowrap">
          {companyName}
        </h1>
      </div>

      {/* Beige panel with a subtle fluted-glass shader texture */}
      <div className="relative w-full [--color-primary:#7CB342] bg-[var(--color-primary)] z-10 min-h-[260px] sm:min-h-[320px] md:min-h-[400px]">
        {/* Background shader */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <FlutedGlass
            size={0.89}
            shape="lines"
            angle={0}
            distortionShape="prism"
            distortion={0.5}
            shift={0}
            blur={0}
            edges={0.25}
            stretch={0}
            scale={1.11}
            fit="cover"
            highlights={0.1}
            shadows={0.2}
            grainMixer={0.1}
            grainOverlay={0.1}
            colorBack="#00000000"
            colorHighlight="#FFFFFF"
            colorShadow="#000000"
            className="w-full h-full bg-transparent"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 md:px-12 lg:px-24 py-8 sm:py-12 md:py-24 flex flex-row justify-between gap-3 sm:gap-8 md:gap-16 lg:gap-8">

          {/* Left side */}
          <div className="flex flex-col justify-between max-w-[100px] sm:max-w-[200px] md:max-w-sm w-full shrink-0">
            <div className="flex flex-col">
              <Logo imgClassName="h-6 sm:h-7 md:h-8 w-auto object-contain mb-2 sm:mb-3" />
              <h2 className="text-ink text-[11px] sm:text-sm md:text-xl md:text-[22px] font-medium leading-tight">
                One Step Toward<br />Transparent Giving
              </h2>
            </div>

            <div className="flex flex-col gap-2 mt-6 sm:mt-8 lg:mt-auto pt-4 sm:pt-6 md:pt-8">
              <div className="flex items-center gap-2 sm:gap-3">
                {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-ink/10 hover:bg-ink/20 text-ink transition-colors"
                  >
                    <Icon size={14} className="sm:hidden" />
                    <Icon size={16} className="hidden sm:block" />
                  </a>
                ))}
              </div>
              <p className="font-light text-ink/70 text-[8px] sm:text-[10px] md:text-[13px] mt-1 leading-snug">
                &copy; {new Date().getFullYear()} {companyName}, All rights reserved
              </p>
            </div>
          </div>

          {/* Right side — links */}
          <div className="flex gap-2 sm:gap-6 md:gap-16 lg:gap-24 flex-wrap sm:flex-nowrap">
            {footerLinks.map((section) => (
              <div key={section.title} className="flex flex-col gap-2 sm:gap-3 md:gap-5">
                <h3 className="text-ink font-semibold text-[10px] sm:text-xs md:text-lg md:text-xl whitespace-nowrap">
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-1 sm:gap-1.5 md:gap-3 md:gap-4">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-ink/70 hover:text-ink transition-colors text-[9px] sm:text-[11px] md:text-sm md:text-[15px] font-medium whitespace-nowrap"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
