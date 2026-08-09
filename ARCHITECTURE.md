# Architecture

`lib/content/loader.ts` is the server-only content boundary. It reads `content/tracks.json`, then walks `content/modules/<track>/<module>/module.json`, validates both against Zod schemas, parses lesson frontmatter, exposes deterministic ordering (module numbers are unique *within* a track; module slugs and lesson IDs stay unique *across every track*), and fails with the responsible filename. App Router pages statically enumerate track, module, and lesson routes.

Routes: `/learn` lists every track, `/tracks/[trackSlug]` lists a track's modules, `/learn/[moduleSlug]` and `/learn/[moduleSlug]/[lessonSlug]` are unchanged from before the track system — module slugs and lesson IDs are enforced globally unique specifically so these routes didn't need a track segment.

Lesson bodies are trusted local MDX compiled in a Server Component. Reusable teaching blocks are passed explicitly, while Shiki highlighting runs during rendering and ships only highlighted HTML/CSS—not a browser highlighter.

`ProgressProvider` is the single client-side state boundary. It hydrates from versioned local storage after mount, sanitizes malformed data through pure functions, and provides narrow mutation actions, including a daily `activityDates` log used to compute the homepage streak. Server pages pass stable curriculum IDs to progress widgets, avoiding duplicate content loading and hydration mismatches.

`components/motion/*` and `MotionConfig reducedMotion="user"` in the root layout are the animation boundary: page transitions, the animated progress ring, and lesson-completion confetti all live there, all client-only, and all automatically disabled when the OS requests reduced motion.

`components/command/CommandPalette.tsx` is a client provider mounted once in the root layout, fed the full track/module/lesson list from the server so Ctrl/Cmd+K search never needs another content fetch. `components/roadmap/RoadmapGraph.tsx` (an `@xyflow/react` canvas) is loaded via `next/dynamic({ ssr: false })` through `RoadmapGraphLoader.tsx`, since React Flow assumes a browser environment — the wrapping page component stays a normal server component that fetches tracks/modules as usual.

`ProgressProvider` also owns the optional Supabase sync: `session` (from `localStorage` under `zerotohero-session`) and a debounced push to the `progress` table whenever local progress changes, only when both a session exists and `lib/supabase/client.ts` resolves real env vars — otherwise every sync-related call is a no-op and the provider behaves exactly as it did before sync existed. `supabase/schema.sql` is the source of truth for the remote schema and RLS policy design; run it once per Supabase project.

The dependency direction is:

```text
tracks.json + content files → validated loader → server routes → rendered MDX
curriculum IDs → client progress provider → localStorage → (optional, debounced) → Supabase
```

The Python Backend track has complete `.mdx` bodies and generated lesson routes for its 15-module core; Modules 16–18 are advanced planned outlines. Every track exposes its planned module outlines so the roadmap is visible immediately; modules flip to `"available"` as their `.mdx` files are authored and reviewed, the same mechanism the original single-track site used.
