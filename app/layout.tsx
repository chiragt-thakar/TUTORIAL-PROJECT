import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getModules } from "@/lib/content/loader";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { MobileNavigation, Sidebar } from "@/components/navigation/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const deploymentUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
export const metadata: Metadata = { metadataBase: new URL(deploymentUrl), title: { default: "Python Backend + FastAPI: Zero to Master", template: "%s · PyBackend" }, description: "A focused Python backend engineering curriculum for an experienced Node.js and TypeScript developer.", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" }, openGraph: { title: "Python Backend + FastAPI: Zero to Master", description: "A focused path from TypeScript to production Python.", images: [{ url: "/og.png", width: 1728, height: 917, alt: "Python Backend and FastAPI: Zero to Master" }] }, twitter: { card: "summary_large_image", title: "Python Backend + FastAPI: Zero to Master", description: "A focused path from TypeScript to production Python.", images: ["/og.png"] } };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { const modules = await getModules(); const themeScript = "try{const t=localStorage.getItem('pybackend-theme');if(t)document.documentElement.dataset.theme=t}catch{}"; return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className={`${geistSans.variable} ${geistMono.variable}`}><ProgressProvider><a className="skip-link" href="#main-content">Skip to content</a><div className="app-shell"><Sidebar modules={modules} /><div className="page-shell"><header className="mobile-header"><MobileNavigation modules={modules} /><span>PyBackend_</span><ThemeToggle /></header><div className="desktop-theme"><ThemeToggle /></div><main id="main-content">{children}</main></div></div></ProgressProvider></body></html>; }
