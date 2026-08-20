"use client";

import { useState } from "react";
import type { RenderedCode } from "@/lib/practice/types";

/**
 * A practice code block. The HTML was highlighted during the build by `lib/practice/render.ts`,
 * so this only has to frame it and hand the raw text to the clipboard — no highlighter reaches
 * the browser. Mirrors `components/mdx/CopyCodeBlock.tsx` so practice code and lesson code look
 * and behave identically.
 */
export function CodePanel({ code, label }: { code: RenderedCode; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code.code);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className="pcode">
      <div className="code-toolbar">
        <span>{label ?? code.language}</span>
        <button type="button" className="copy-code-button" onClick={copy} aria-label="Copy code sample">
          {state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : "Copy"}
        </button>
      </div>
      <div className="pcode-body" dangerouslySetInnerHTML={{ __html: code.html }} />
    </div>
  );
}
