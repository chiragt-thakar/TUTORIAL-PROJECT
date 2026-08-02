"use client";
import { useSyncExternalStore } from "react";

const eventName = "pybackend-theme-change";
function getTheme() { const stored = localStorage.getItem("pybackend-theme"); return stored ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
function subscribe(listener: () => void) { window.addEventListener(eventName, listener); const media = matchMedia("(prefers-color-scheme: dark)"); media.addEventListener("change", listener); return () => { window.removeEventListener(eventName, listener); media.removeEventListener("change", listener); }; }
export function ThemeToggle() { const theme = useSyncExternalStore(subscribe, getTheme, () => "light"); const dark = theme === "dark"; return <button className="theme-toggle" type="button" aria-label={`Switch to ${dark ? "light" : "dark"} mode`} onClick={() => { const next = dark ? "light" : "dark"; document.documentElement.dataset.theme = next; localStorage.setItem("pybackend-theme", next); window.dispatchEvent(new Event(eventName)); }}><span aria-hidden="true">{dark ? "☀" : "◐"}</span></button>; }
