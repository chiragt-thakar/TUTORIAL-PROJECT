# Zero to Hero: Python, Backend, AI & ML

A personal, project-driven learning platform organized into **tracks**: Python Backend + FastAPI (15 fully authored core modules plus 3 planned advanced modules), Python Libraries, Generative AI Engineering, AI & Machine Learning, and Maths for AI & ML. The Python Backend core is complete end to end (79 lessons, 15 cumulative assignments); advanced and newer-track modules are rolling out module by module, with their curricula outlined as "planned" so the whole path is visible from day one.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4 with handwritten dark-first design tokens
- Local MDX rendered in Server Components with `next-mdx-remote`
- YAML plus Zod frontmatter and module metadata validation
- Server-side Shiki highlighting through `rehype-pretty-code`
- Framer Motion for page transitions, the progress ring, and completion feedback
- `cmdk` command palette (Ctrl/Cmd+K) and `@xyflow/react` for the roadmap skill tree
- Versioned browser `localStorage` for device-local progress, with optional Supabase sync (see below)
- Node's test runner through `tsx`

## Prerequisites and installation

Use Node.js 22.13 or newer and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`. On shells that permit `npm.ps1`, `npm` works as usual.

## Validation and static build

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The build command creates a static site in `out/`. It can be hosted on Vercel or any static hosting provider.

## Content structure

**The curriculum is generated from the roadmap.** `content/roadmap/AI_ML_MASTERY_ROADMAP.md` holds
the learner's AI/ML Mastery Roadmap verbatim, and `scripts/generateRoadmapCurriculum.ts`
(`npm run generate:roadmap`) turns it into navigation: one group per phase, one module per numbered
subsection, one lesson per `- [ ]` checkbox, with a lesson's id equal to its roadmap topic id. The
generated files — `content/groups.json` and everything under `content/modules/mastery/` — are not
hand-edited. `tests/roadmapCurriculum.test.ts` fails if the document and the curriculum drift apart.

`content/tracks.json` registers the storage tracks (which directory a module's files live in);
`content/groups.json` defines what navigation actually shows. Material written before the site
followed the roadmap lives in the **Extra Learning** group, sub-grouped by the track it came from.
Every listed lesson and assignment for an `available` module has matching `.mdx` content with
validated frontmatter; `planned` modules and lessons only need metadata. See `CONTENT_GUIDE.md` for
the authoring contract.

Content loading is centralized in `lib/content/loader.ts`. Pages are statically generated from local
files, and metadata failures stop the build with a file-specific error. Module slugs and lesson IDs
stay globally unique across every track, since progress is stored by lesson ID and lesson routes are
`/learn/[moduleSlug]/[lessonSlug]`.

## Progress behavior

Progress lives on the current device first, under `python-backend-learning-progress:v1` in `localStorage`. It records completed lessons, exercises, assignments, the last visited lesson, and a daily activity log used for the streak. Invalid or older data safely resets. The first server render is deterministic; stored progress is applied only after hydration. Local progress works fully with no account — sync (below) is optional and additive.

## Optional cross-device sync (Supabase)

The site can mirror local progress to your own free Supabase project so it follows you to another browser or device. This is deliberately minimal and **not production-grade auth** — see the comments in `supabase/schema.sql` before using it:

1. Create a free project at [supabase.com](https://supabase.com) (no credit card required on the free tier).
2. In the Supabase SQL editor, run the contents of `supabase/schema.sql` once.
3. Copy your project's URL and `anon` public key (Project Settings → API).
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables (locally in `.env.local`, and in your Vercel project settings for production), then redeploy.
5. Visit `/account` to create an account and sign in. Passwords are stored and compared in plain text by explicit design — this is a personal single-user tool, not a place to reuse a real password.

Without those two environment variables set, `/account` explains sync isn't configured and the rest of the site is completely unaffected — this is the default state and is fully supported.

**Step 2 is not optional and is easy to skip.** Setting only the environment variables gets you a
reachable project with no tables, and every sync call fails with `PGRST205 Could not find the table
'public.progress'`. If sync silently never works, run `supabase/schema.sql` first and check again.

What syncs, once it is on:

- **Progress** — lessons, exercises, assignments, roadmap topic passes, Proof Gates, activity dates,
  and logged focus sessions, in one `progress` row per user.
- **Lesson notes** — one `notes` row per (user, lesson).

Sync is **pull-merge-push**, not last-writer-wins. On load, on sign-in, and whenever the tab regains
focus, the client pulls the server copy, merges it with the local one, and pushes the union back.
The merge (`mergeProgress` in `lib/progress/progress.ts`, covered by `tests/progress.test.ts`) is
additive: unions for completed items, the higher value for a topic's 3-pass level, and union-by-id
for focus sessions so two devices never double-count. The deliberate consequence is that
**un-ticking something only sticks once it has synced** — losing a device's work is a worse failure
than keeping a tick you meant to clear.

## Free deployment

The project is prepared for Vercel's free Hobby plan and contains no ChatGPT Sites, vinext, Wrangler, or Cloudflare Worker integration. Supabase sync, if enabled, also stays on its free tier. See `DEPLOYMENT.md` for the Vercel steps and a Cloudflare Pages free fallback.

## Architectural decisions

- Server Components own filesystem content loading and MDX compilation.
- Client Components are limited to local progress, theme, responsive navigation state, the command palette, the roadmap graph, and the Framer Motion animation layer (page transitions, progress rings, completion feedback) — all of it respects `prefers-reduced-motion`.
- Module JSON stores small curriculum metadata; long-form teaching stays in MDX.
- Curriculum availability is explicit in module and track metadata, and every currently available route has authored content.
- The site has no traditional backend or server API of its own — Supabase, when configured, is called directly from the browser with its `anon` key, exactly like any other client-side REST call.

## Limitations

- Sync is opt-in and intentionally minimal: plain-text password matching, no password reset, no email verification. Don't reuse a real password.
- The course embeds project code rather than generating a separate downloadable backend repository.
- Code copy buttons are omitted to keep client JavaScript and maintenance cost low.
