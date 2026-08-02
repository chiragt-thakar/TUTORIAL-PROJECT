# Architecture

`lib/content/loader.ts` is the server-only content boundary. It reads and validates module JSON, parses lesson frontmatter, exposes deterministic ordering, and fails with the responsible filename. App Router pages statically enumerate module and lesson routes.

Lesson bodies are trusted local MDX compiled in a Server Component. Reusable teaching blocks are passed explicitly, while Shiki highlighting runs during rendering and ships only highlighted HTML/CSS—not a browser highlighter.

`ProgressProvider` is the single client-side state boundary. It hydrates from versioned local storage after mount, sanitizes malformed data through pure functions, and provides narrow mutation actions. Server pages pass stable curriculum IDs to progress widgets, avoiding duplicate content loading and hydration mismatches.

The dependency direction is:

```text
content files → validated loader → server routes → rendered MDX
curriculum IDs → client progress provider → localStorage
```

All 15 modules currently have complete `.mdx` bodies and generated lesson routes. Availability remains an explicit metadata state, so a future planned module can expose its outline without creating empty lesson pages.
