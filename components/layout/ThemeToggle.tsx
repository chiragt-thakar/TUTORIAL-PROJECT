"use client";
import { useSyncExternalStore } from "react";

const storageKey = "zerotohero-theme";
const eventName = "zerotohero-theme-change";

function getTheme() {
  const stored = localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  const media = matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", listener);
  return () => { window.removeEventListener(eventName, listener); media.removeEventListener("change", listener); };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark");
  const dark = theme === "dark";
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      onClick={() => {
        const next = dark ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem(storageKey, next);
        window.dispatchEvent(new Event(eventName));
      }}
    >
      <span aria-hidden="true">{dark ? "☀" : "◐"}</span>
    </button>
  );
}
