import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { getGroups, getModules, getTracks } from "@/lib/content/loader";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { MobileNavigation, Sidebar } from "@/components/navigation/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PageTransition } from "@/components/motion/PageTransition";
import { CommandPaletteProvider, PaletteTrigger } from "@/components/command/CommandPalette";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT"] });
const deploymentUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(deploymentUrl),
  title: { default: "Zero to Hero: Python, Backend, AI & ML", template: "%s · ZeroToHero" },
  description: "A personal, project-driven learning platform: Python, backend engineering, generative AI, machine learning, and the maths behind them, from zero to advanced.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "Zero to Hero: Python, Backend, AI & ML", description: "The AI/ML Mastery Roadmap as a site: every phase, every section, every topic.", images: [{ url: "/og.png", width: 1728, height: 917, alt: "Zero to Hero learning platform" }] },
  twitter: { card: "summary_large_image", title: "Zero to Hero: Python, Backend, AI & ML", description: "The AI/ML Mastery Roadmap as a site: every phase, every section, every topic.", images: ["/og.png"] },
};

const themeScript = "try{const t=localStorage.getItem('zerotohero-theme');if(t==='light')document.documentElement.dataset.theme='light';else if(!t&&matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.dataset.theme='light'}catch{}";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [modules, groups, tracks] = await Promise.all([getModules(), getGroups(), getTracks()]);
  const lessons = modules.filter((module) => module.status === "available").flatMap((module) => module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, moduleTitle: module.title, href: `/learn/${module.slug}/${lesson.slug}` })));

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}>
        <MotionConfig reducedMotion="user">
          <ProgressProvider>
            <CommandPaletteProvider groups={groups} modules={modules} lessons={lessons}>
              <div className="bg-grid" aria-hidden="true">
                <div className="bg-grid-lines" />
                <div className="bg-glow bg-glow-a" />
                <div className="bg-glow bg-glow-b" />
                <div className="bg-glow bg-glow-c" />
              </div>
              <a className="skip-link" href="#main-content">Skip to content</a>
              <div className="app-shell">
                <Sidebar modules={modules} groups={groups} tracks={tracks} />
                <div className="page-shell">
                  <header className="mobile-header">
                    <MobileNavigation modules={modules} groups={groups} tracks={tracks} />
                    <span>ZeroToHero_</span>
                    <div className="mobile-header-actions"><PaletteTrigger /><ThemeToggle /></div>
                  </header>
                  <div className="desktop-theme"><PaletteTrigger /><ThemeToggle /></div>
                  <main id="main-content"><PageTransition>{children}</PageTransition></main>
                </div>
              </div>
            </CommandPaletteProvider>
          </ProgressProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
