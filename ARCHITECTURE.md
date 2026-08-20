# Architecture

`lib/content/loader.ts` is the server-only content boundary. It reads `content/tracks.json`, then walks `content/modules/<track>/<module>/module.json`, validates both against Zod schemas, parses lesson frontmatter, exposes deterministic ordering (module numbers are unique *within* a track; module slugs and lesson IDs stay unique *across every track*), and fails with the responsible filename. App Router pages statically enumerate track, module, and lesson routes.

`content/roadmap/AI_ML_MASTERY_ROADMAP.md` sits above that boundary. `lib/content/roadmapParser.ts` parses it into the structures the roadmap pages render, and `scripts/generateRoadmapCurriculum.ts` uses the same parser to *generate* `content/groups.json` and `content/modules/mastery/**` — one navigation group per phase, one module per numbered subsection, one lesson per checkbox, with each lesson's id equal to its roadmap topic id. So the document is the single source of truth for both the plan and the curriculum's shape, and `lib/curriculum/roadmapSections.ts` lets a module page read its section's prose and resource block back out of the markdown at request time rather than storing a second copy.

Routes: `/learn` lists every navigation group, `/paths/[groupSlug]` lists a group's modules (plus, for a phase, its framing, resources and Proof Gate), and `/learn/[moduleSlug]` / `/learn/[moduleSlug]/[lessonSlug]` carry no track segment — module slugs and lesson IDs are enforced globally unique specifically so they don't need one.

Lesson bodies are trusted local MDX compiled in a Server Component. Reusable teaching blocks are passed explicitly, while Shiki highlighting runs during rendering and ships only highlighted HTML/CSS—not a browser highlighter.

`lib/practice/loader.ts` is the second content boundary, mirroring the first. It reads
`<lesson-slug>.practice.yaml` beside each lesson, validates it against `lib/practice/schema.ts`,
and cross-checks the file's declared module and lesson against where it sits on disk.
`lib/practice/render.ts` runs Shiki over every code field during the build, so the client
components receive ready HTML and no highlighter ships to the browser. `getPracticeIndex()` returns
a stripped projection — ids, tiers and mastery rules, no prompts or solutions — because `/practice`
is a static page and shipping every answer to it would put them one devtools panel away.
`lib/practice/mastery.ts` and `lib/practice/select.ts` are pure and know nothing about the progress
store; `components/practice/useReport.ts` is the single adapter between them, which is why the
lesson workbench and the practice hub can never disagree about a topic's status.

`components/practice/Workbench.tsx` renders the seven modes (Learn, Practice, Debug, Interview,
Test, Project, Review) as tabs on one route, taking the server-rendered MDX as `children` for its
Learn panel — a Server Component passed into a Client Component. The Learn panel stays mounted and
hidden so the table of contents and reading-progress bar keep working; the rest mount lazily so a
quiz in progress survives a detour. Mode is deep-linked through the URL hash rather than a query
param, since `useSearchParams` would force a Suspense boundary under static export.

`ProgressProvider` is the single client-side state boundary. It hydrates from versioned local storage after mount, sanitizes malformed data through pure functions, and provides narrow mutation actions, including a daily `activityDates` log used to compute the homepage streak. Server pages pass stable curriculum IDs to progress widgets, avoiding duplicate content loading and hydration mismatches.

`components/motion/*` and `MotionConfig reducedMotion="user"` in the root layout are the animation boundary: page transitions, the animated progress ring, and lesson-completion confetti all live there, all client-only, and all automatically disabled when the OS requests reduced motion.

`components/command/CommandPalette.tsx` is a client provider mounted once in the root layout, fed the full track/module/lesson list from the server so Ctrl/Cmd+K search never needs another content fetch. `components/roadmap/RoadmapGraph.tsx` (an `@xyflow/react` canvas) is loaded via `next/dynamic({ ssr: false })` through `RoadmapGraphLoader.tsx`, since React Flow assumes a browser environment — the wrapping page component stays a normal server component that fetches tracks/modules as usual.

`ProgressProvider` also owns the optional Supabase sync: `session` (from `localStorage` under `zerotohero-session`) and a debounced push to the `progress` table whenever local progress changes, only when both a session exists and `lib/supabase/client.ts` resolves real env vars — otherwise every sync-related call is a no-op and the provider behaves exactly as it did before sync existed. `supabase/schema.sql` is the source of truth for the remote schema and RLS policy design; run it once per Supabase project.

The dependency direction is:

```text
AI_ML_MASTERY_ROADMAP.md → parser → generator → groups.json + modules/mastery/**
tracks.json + content files → validated loader → server routes → rendered MDX
curriculum IDs → client progress provider → localStorage → (optional, debounced) → Supabase
```

Written content — the 15-module Python Backend core, the 8 Gen AI modules, and one NumPy lesson — lives in the **Extra Learning** group, sub-grouped by the storage track it came from. The 47 roadmap-derived modules are honest outlines: every topic is listed and every topic is one click away, and a lesson flips to `"available"` as its `.mdx` file is authored and reviewed. `lib/content/published.ts` lets a single finished lesson publish inside a still-planned module, so content ships one sub-topic at a time.
