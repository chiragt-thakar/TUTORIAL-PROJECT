"use client";

import { useRef, useState } from "react";

type CodeBlockProps = React.ComponentPropsWithoutRef<"pre"> & {
  "data-language"?: string;
};

export function CopyCodeBlock({ children, "data-language": language, ...props }: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyCode() {
    const code = codeRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 1800);
  }

  const label = state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : "Copy";

  return (
    <div className="code-block-shell">
      <div className="code-toolbar">
        <span>{language ?? "code"}</span>
        <button type="button" className="copy-code-button" onClick={copyCode} aria-label="Copy code sample">
          {label}
        </button>
      </div>
      <pre ref={codeRef} data-language={language} {...props}>{children}</pre>
    </div>
  );
}
