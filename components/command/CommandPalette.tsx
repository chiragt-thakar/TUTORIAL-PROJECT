"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import type { Module, Track } from "@/types/curriculum";
import { useProgress } from "@/components/progress/ProgressProvider";
import { nextIncompleteLesson } from "@/lib/progress/progress";

interface PaletteLesson { id: string; title: string; moduleTitle: string; href: string }
interface PaletteContextValue { open: () => void }
const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useCommandPalette(): PaletteContextValue {
  const value = useContext(PaletteContext);
  if (!value) throw new Error("useCommandPalette must be used inside CommandPaletteProvider");
  return value;
}

export function PaletteTrigger() {
  const { open } = useCommandPalette();
  return (
    <button className="palette-trigger" type="button" aria-label="Open command palette (Ctrl/Cmd K)" title="Search (Ctrl/Cmd K)" onClick={open}>
      <span aria-hidden="true">⌘</span>
    </button>
  );
}

export function CommandPaletteProvider({ children, tracks, modules, lessons }: { children: React.ReactNode; tracks: Track[]; modules: Module[]; lessons: PaletteLesson[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { progress } = useProgress();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const go = useCallback((href: string) => { setIsOpen(false); router.push(href); }, [router]);

  const continueHref = (() => {
    const id = nextIncompleteLesson(lessons.map((lesson) => lesson.id), progress.completedLessons, progress.lastVisitedLesson);
    return lessons.find((lesson) => lesson.id === id)?.href ?? lessons[0]?.href ?? "/learn";
  })();

  return (
    <PaletteContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <Command.Dialog open={isOpen} onOpenChange={setIsOpen} label="Command palette">
        <Command.Input autoFocus placeholder="Jump to a track, module, lesson, or action…" />
        <Command.List>
          <Command.Empty>No matches. Try a different search.</Command.Empty>

          <Command.Group heading="Actions">
            <Command.Item onSelect={() => go(continueHref)}>
              <span className="cmdk-icon" aria-hidden="true">▶</span> Continue learning
            </Command.Item>
            <Command.Item onSelect={() => go("/")}>
              <span className="cmdk-icon" aria-hidden="true">⌂</span> Dashboard
            </Command.Item>
            <Command.Item onSelect={() => go("/roadmap")}>
              <span className="cmdk-icon" aria-hidden="true">◈</span> Open roadmap
            </Command.Item>
            <Command.Item onSelect={() => go("/learn")}>
              <span className="cmdk-icon" aria-hidden="true">▤</span> All tracks
            </Command.Item>
            <Command.Item onSelect={() => go("/account")}>
              <span className="cmdk-icon" aria-hidden="true">☺</span> Account &amp; sync
            </Command.Item>
            <Command.Item onSelect={() => {
              const dark = document.documentElement.dataset.theme !== "light";
              const next = dark ? "light" : "dark";
              document.documentElement.dataset.theme = next;
              localStorage.setItem("zerotohero-theme", next);
              window.dispatchEvent(new Event("zerotohero-theme-change"));
              setIsOpen(false);
            }}>
              <span className="cmdk-icon" aria-hidden="true">◐</span> Toggle light / dark theme
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Tracks">
            {tracks.map((track) => (
              <Command.Item key={track.slug} value={`track ${track.title}`} onSelect={() => go(`/tracks/${track.slug}`)}>
                <span className="cmdk-icon" aria-hidden="true">◇</span> {track.title}
                <span className="cmdk-meta">{track.status === "planned" ? "Planned" : "Track"}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Modules">
            {modules.filter((module) => module.status === "available").map((module) => (
              <Command.Item key={module.slug} value={`module ${module.title}`} onSelect={() => go(`/learn/${module.slug}`)}>
                <span className="cmdk-icon" aria-hidden="true">▣</span> {module.title}
                <span className="cmdk-meta">Module {String(module.number).padStart(2, "0")}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Lessons">
            {lessons.map((lesson) => (
              <Command.Item key={lesson.id} value={`lesson ${lesson.title} ${lesson.moduleTitle}`} onSelect={() => go(lesson.href)}>
                <span className="cmdk-icon" aria-hidden="true">＃</span> {lesson.title}
                <span className="cmdk-meta">{lesson.moduleTitle}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </PaletteContext.Provider>
  );
}
