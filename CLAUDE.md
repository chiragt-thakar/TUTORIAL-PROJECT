# CLAUDE.md — read this first, keep it current

This file is the single source of truth for continuing this project across sessions and
across agents. Any Claude Code session opened in this repo loads this file automatically.
**If you do meaningful work in this repo, update the "Status" and "Next up" sections below
before you finish** — the next agent (possibly you, possibly not) has no memory of this
conversation and will orient entirely from this file plus the code.

## What this project is

A personal, single-user learning platform for the repo owner: a backend engineer (Node.js /
TypeScript / Express / Postgres / Redis / Kafka background) going from Python zero to an
advanced Generative AI / AI-ML engineer, capable of shipping real production AI systems. It is
explicitly **not** a commercial course site — no marketing copy, no gating, no artificial
gamification. See `README.md` for the elevator pitch and stack, `ARCHITECTURE.md` for how the
pieces fit together, `CONTENT_GUIDE.md` for the authoring contract, and
**`AUTHORING_PATTERN.md` for the exact two-file shape every topic is written in** (read those last
two in full before writing or editing any lesson).

> **The purpose changed on 2026-08-20: this is a practice-first system, not a reading site.**
> **`PRACTICE_SYSTEM.md` is the brief and the current state of that rebuild — read it before
> anything else in this file, and keep its "Progress log" section up to date.** It supersedes the
> parts of this file that assume lessons are prose to be read: every topic now also carries
> exercises with progressive hints, debugging and code-reading problems, interview questions, a
> scored assessment, a real project, curated resources, and an earned mastery status.

## Standing rules (do not relitigate these without the user asking)

- **Nothing is ever gated.** No "locked" modules, no forced sequencing, no daily-checklist
  pressure. Every track, module, and available lesson is always one click away, from the
  sidebar, the `/roadmap` skill tree, and the dashboard's "All Modules" section alike. A
  `"planned"` module (not yet written) is shown honestly as an outline, never as "locked."
- **Dark-first design, warm-graphite palette (redesigned 2026-08-20).** Near-black warm graphite
  surfaces, an ember/amber primary accent (`--accent`) paired with a teal secondary
  (`--accent-cyan`), headings set in Fraunces (a serif display font, `--font-display`) over
  Geist Sans body text and Geist Mono for code/labels. Everything derives from the CSS custom
  properties at the top of `app/globals.css`, so a palette change there cascades sitewide — don't
  hardcode colors in components. Light theme is a fully redesigned warm-paper palette (not an
  afterthought), toggled explicitly, never the default. `components/motion/Reveal.tsx` and
  `AnimatedNumber.tsx` are the scroll-reveal / count-up primitives; prefer them over one-off
  animations when adding new sections.
- **Content depth standard** (full text in `CONTENT_GUIDE.md`, top section) applies to every
  module built from here forward: beginner → advanced lessons with no shallow stop, five
  exercises per lesson tagged `difficulty="easy|medium|hard|interview|real-world"`, a
  `<Gotchas>` section with immediately-visible answers, and a real applied project for the
  assignment — not a toy. `tests/content.test.ts` enforces the five-tier + gotchas requirement
  automatically for every track except `python-backend`.
- **One sub-topic at a time, full depth (changed 2026-08-20).** Author a single lesson on a single
  roadmap topic, to the complete depth standard, then ship it and move to the next. A lesson can
  carry its own `"status": "available"` inside a still-`"planned"` module, so finished work is
  readable immediately — see `CONTENT_GUIDE.md` → "Authoring one sub-topic at a time" and
  `lib/content/published.ts`. A module still only flips to `"available"` when every lesson **and**
  its assignment are done; the per-lesson flag publishes early, it does not lower that bar. Don't
  scaffold five lessons shallowly when the ask is one lesson done properly. **The outline already
  exists** — pick the next generated lesson under `content/modules/mastery/`, keep its `id` (it is
  the roadmap topic id and carries the 3-pass progress), fill in `description`,
  `learningObjectives` and a real `estimatedMinutes`, set `"status": "available"`, and write the MDX.
  **Since 2026-08-20 the MDX is only half of it** — the topic also needs its
  `<lesson-slug>.practice.yaml` (exercises, debugging, interview questions, assessment, project,
  resources) before it counts as done. See `PRACTICE_SYSTEM.md` and `CONTENT_GUIDE.md` →
  "The practice layer".
- **Voice: senior engineer teaching a fast learner, not a textbook.** Explain mental models the
  way an experienced developer would explain them to a smart junior — precise, opinionated,
  grounded in what actually goes wrong in production, not encyclopedic. The goal is a learner who
  comes out the other side thinking like a senior engineer, not one who memorized definitions.
- **Gen AI track includes a framework module.** Module 8, "The LangChain Ecosystem" (LangChain,
  LangGraph, LangSmith), sits after Agents/Workflows and Context/Memory and before Evaluation —
  by design, students build the raw mechanics by hand first (tool calling, RAG, agent loops,
  eval harnesses in Modules 3/5/6/2) and only then meet the framework that packages them, so the
  framework reads as "oh, that's what I already built" instead of magic.
- **The mastery roadmap is the spine of the whole site.** `content/roadmap/AI_ML_MASTERY_ROADMAP.md`
  is the learner's own AI/ML Mastery Roadmap, stored **verbatim and additive-only** — never
  paraphrase, compress, reorder, or delete anything in it; you may add, never subtract. It is
  parsed, not transcribed (`lib/content/roadmapParser.ts`), so nothing can drift from the document,
  and `tests/roadmap.test.ts` fails if a single topic goes missing. It surfaces on **two pages that
  must stay distinct**:
  - `/roadmap/mastery` — the **phase hub** (`components/roadmap/PhaseHub.tsx`), the working surface:
    11 phases, the current one spotlit, per-topic 3-pass controls, Proof Gates, linked modules.
  - `/roadmap/mastery/source` — the **raw document** (`components/roadmap/RoadmapDocument.tsx`),
    the verbatim text end to end. This page exists so the source is always readable unmediated;
    don't merge it into the hub or start summarising it.

  `lib/curriculum/phases.ts` derives phase summaries from roadmap + modules and is what the hub,
  dashboard, and track labels all read. `tests/phases.test.ts` guards that no topic is stranded
  outside a phase group. See `CONTENT_GUIDE.md` → "The mastery roadmap" for ID-stability rules.
- **The curriculum is GENERATED from the roadmap (changed 2026-08-21).** `content/groups.json` and
  every module under `content/modules/mastery/` are written by
  `scripts/generateRoadmapCurriculum.ts` (`npm.cmd run generate:roadmap`) straight from
  `content/roadmap/AI_ML_MASTERY_ROADMAP.md`. **Never hand-edit those files** — edit the roadmap and
  re-run the generator. The mapping is one-to-one and mechanical: a `## PHASE n` becomes a
  navigation group, a `### n.m` becomes a module, and **every `- [ ]` checkbox becomes one lesson**,
  with the checkbox's exact wording as the lesson title. `tests/roadmapCurriculum.test.ts` fails if
  the document and the curriculum ever disagree, in either direction.
- **Navigation is the roadmap's own sequence.** 13 groups: `phase-0` … `phase-10`,
  `cross-cutting-tracks`, then `extra-learning` last. `Track` and `content/modules/<track>/` are
  storage only; the one place a track surfaces in the UI is as sub-headings inside Extra Learning.
  `lib/curriculum/groups.ts` builds navigation. Group titles, section numbers, `[CORE]`/`[TOOL]`
  tags and durations are copied verbatim from the document.
- **A module is "on the roadmap" iff it has `roadmapSectionId`** (`isRoadmapModule()`). That field is
  set by the generator on exactly the 47 modules it creates, and on nothing else — `roadmapPhase`
  alone would wrongly exclude the cross-cutting tracks, which are on the roadmap but in no phase.
  Navigation shows the document's own section number ("1.2", "P0", "A") as the chip, via `navRef()`.
- **Extra Learning is where the previously written material lives.** Everything with prose on disk —
  `python-backend` 1–15, `gen-ai` 1–8, `python-libraries/numpy-arrays` — moved there when the site
  was rebuilt around the roadmap, keeping every lesson id, so no progress was lost. Metadata-only
  outlines that the roadmap already covers were deleted (the generated modules replace them);
  outlines with no roadmap equivalent stayed. An extra module may carry `relatedRoadmapSection` as a
  cross-reference to the roadmap section it overlaps — a pointer, not membership.
- **Module build order follows the roadmap.** Build/retrofit work proceeds phase-by-phase — see
  "Next up". A module's `number` is its stable identity and directory prefix, *not* its navigation
  position, so adding a module for an early roadmap subsection never requires renumbering: give it
  the next free `number` plus the right `roadmapGroup`/`group` and it lands in place automatically.
- **Progress is a v2 store keyed to the roadmap's own methodology.** `lib/progress/progress.ts`
  tracks, beyond lessons/exercises/assignments: `topicPasses` (the roadmap's 3-pass rule —
  intuition / derived on paper / implemented from scratch; a topic only counts as done at pass 3),
  `topicDates` (feeds the 3-week review queue), `proofGates`, and `sessions` (focus time logged
  against the roadmap's 4h-math / 6h-main / 3h-build / 1h-paper weekly cadence). `parseProgress`
  migrates v1 automatically — legacy binary roadmap ticks become pass 3 — so don't break that path.
  Features here should come from the roadmap's own prescriptions, not invented gamification.
- **Supabase sync is optional and intentionally minimal** (plain-text password match, no
  hashing, no email verification — see `supabase/schema.sql`). Never "improve" this into a real
  auth system unless explicitly asked. The app must work fully local-only with zero env vars set.
  Sync is **pull-merge-push** (`pullAndMerge` in `ProgressProvider`, `mergeProgress` in
  `lib/progress/progress.ts`): on mount, sign-in, and tab focus it pulls, merges additively, and
  pushes the union, so a second device never silently loses work. Lesson notes sync too. The
  additive merge means un-ticking only sticks after a sync — that trade is deliberate, don't
  "fix" it into last-writer-wins.
- **No browser/screenshot tool is available in this environment.** Visual QA is done via dev
  server + server logs + rendered-HTML structure checks + manual code review, not by looking at
  pixels. Say so explicitly when reporting back; don't imply you visually confirmed something
  you didn't.

## Status snapshot

Navigation **is** the AI/ML Mastery Roadmap. One group per phase, in the document's own order, then
its cross-cutting tracks, then a single Extra Learning shelf. "Sections" are the roadmap's numbered
subsections (`1.2`), "topics" are its `- [ ]` checkboxes — each is one lesson. "Written" counts MDX
files actually on disk.

| # | Group | Sections | Topics | Written |
|---|---|---|---|---|
| 1 | Phase 0 — Audit What You Already Have | 2 | 13 | 0 |
| 2 | Phase 1 — Python as an ML Engineer's Language | 3 | 28 | 4 |
| 3 | Phase 2 — Mathematics | 6 | 67 | 0 |
| 4 | Phase 3 — Classical ML & Data Science | 5 | 52 | 0 |
| 5 | Phase 4 — Deep Learning Foundations | 5 | 52 | 0 |
| 6 | Phase 5 — NLP, Transformers & LLM Internals | 3 | 38 | 0 |
| 7 | Phase 6 — AI Engineering: Building Real LLM Systems | 5 | 56 | 0 |
| 8 | Phase 7 — Training, Fine-Tuning & Alignment | 5 | 36 | 0 |
| 9 | Phase 8 — Inference, Serving & Systems | 3 | 19 | 0 |
| 10 | Phase 9 — MLOps, LLMOps & Data Engineering | 4 | 26 | 0 |
| 11 | Phase 10 — Specialisation, Research Literacy & Top-1% Behaviour | 3 | 34 | 0 |
| 12 | Cross-Cutting Tracks | 3 | 18 | 0 |
| 13 | Extra Learning | 32 | 154 | 135 |

**79 modules, 593 lessons + 24 assignments, 139 MDX files written.**
47 modules / 439 lessons are generated from the roadmap (434 checkbox topics + Track B's 5
portfolio targets, **4 written**); 32 modules / 154 lessons + 24 assignments are the
previously authored material now in Extra Learning, of which 135 files exist on disk.
The roadmap curriculum is otherwise still honest outline, which is the point: the learner is
rewriting all of it, one topic at a time, to the practice-first standard in `PRACTICE_SYSTEM.md`.
**4 topics carry a practice bank** (`content/modules/mastery/03-1-1-.../*.practice.yaml`).

Shell/UI status: dark-first design system (warm graphite + ember/teal palette, Fraunces display
headings, aurora background), glass sidebar, Ctrl/Cmd+K command palette (`cmdk`).

Key surfaces:
- `/` **Command Center** — Resume card, streak heatmap, focus timer logging into the roadmap's four
  weekly lanes, review queue (topics 3+ weeks stale), phase progress panel, group cards, all-modules
  overview.
- `/roadmap/mastery` **phase hub** — current phase spotlit, 11-phase timeline, per-topic 3-pass
  controls, Proof Gate checkboxes, linked modules.
- `/roadmap/mastery/source` — the verbatim roadmap document, unabridged (434 topics).
- `/roadmap` skill tree — one row per group, section numbers on nodes, dashed edges from an Extra
  Learning module to the roadmap section it covers (derived from `relatedRoadmapSection`).
- `/learn` group cards; `/paths/[groupSlug]` phase pages carrying the phase's own framing, its
  sections, its resource block and its **Proof Gate**; `/learn/[moduleSlug]` section pages carrying
  the roadmap's prose for that section, its topic list, and its **"What to read for N.M"** resource.

Supabase sync is wired to a real project (`.env.local` holds the URL + publishable key), but
`supabase/schema.sql` **has still not been run against it** — every table and RPC returns
`PGRST205`/`PGRST202`, so sync silently no-ops and the site stays local-only. Verify with a REST
probe before debugging the client code.

All of this passes `lint`/`typecheck`/`test`/`build` (52 tests).

## Open questions

1. **Supabase schema still not applied.** `.env.local` points at a real project but
   `supabase/schema.sql` has never been run against it, so every table and RPC 404s and sync
   silently no-ops. Nothing in the app can fix this — the anon key cannot create tables. Ask the
   learner to paste that SQL into the Supabase SQL editor once.
2. **Generated lesson metadata is placeholder, on purpose.** Every roadmap lesson carries a flat
   45-minute estimate, no `description`, and the same three 3-pass `learningObjectives`. That is
   deliberate — an unwritten topic has no honest description — but it means module "hours" figures
   across the roadmap are arithmetic, not estimates. Replace them per lesson as they get written.
3. *Resolved 2026-08-20:* the generator no longer discards hand-written work under
   `content/modules/mastery/`. It snapshots authored files and authored lesson fields before the
   rebuild and merges them back by lesson id, and it aborts before deleting anything if a renamed
   roadmap heading would orphan a file. `npm.cmd run generate:roadmap` is safe to re-run; read its
   summary line, which reports how much it preserved.

*Resolved 2026-08-21:* the roadmap document is **complete**. The earlier "missing tail after 10.3"
question was stale — the third paste landed, the file ends at "Then Phase 1.", and the parser
reports `complete: true` with 434 topics.

*Also found 2026-08-21:* `tests/phases.test.ts` had **two failing tests before this session's work**
(the cross-cutting tracks' 13 topics were stranded outside every phase group, so the conservation
assertions could never hold). Any earlier note claiming all four commands passed was wrong. They
pass now.

## Next up

**Process changed 2026-08-21: there is no scaffolding step any more — the outline is generated.**
The site's structure now *is* the roadmap, so "building a module" is no longer a thing. The only
authoring work is writing lessons, one roadmap topic at a time, in the document's own order:

1. Walk the phases in order (`/paths/phase-0` → `/paths/phase-10`, then `cross-cutting-tracks`).
   Within a phase, walk its sections in the roadmap's numbering (1.1 → 1.2 → 1.3).
2. Within a section, take the next lesson that has no `.mdx` file, write it to the full content
   depth standard (`CONTENT_GUIDE.md`), keep its `id` (it's the roadmap topic id), fill in
   `description` / `learningObjectives` / a real `estimatedMinutes`, add `"status": "available"`,
   and ship it.
3. A module flips to `"status": "available"` only when every one of its lessons is written. There
   are no assignments on generated modules — the phase's **Proof Gate** is the assignment, and it
   already renders on the phase page.
4. Extra Learning is not on the build path. Touch it only if the learner asks.

<details><summary>Superseded processes (kept for history, do not resume)</summary>

**2026-08-20 — build order follows roadmap phase order.** Find the lowest roadmap phase not fully
available, build/retrofit its planned modules in the phase's own topic order, folding untagged
`python-backend`/`python-libraries` retrofits in opportunistically. Superseded because the modules
that process referred to no longer exist: the roadmap generates its own.

**Earlier — alternate one Python Backend retrofit with one new Gen AI module** each session,
working through all 15 PB modules while moving forward through Gen AI. Ran through the Module 8 /
Gen AI 8 pairing recorded below.

</details>

Track progress through this list here as modules complete — check off / update this section
each time a module finishes so the phase order stays on track across sessions.

- [x] Retrofit `python-backend` Module 1 — `python-fundamentals` (all 5 lessons: 5-tier
      exercises + gotchas added; assignment left as-is, it already met the "real project" bar
      as the in-memory Task API repository)
- [x] Build `gen-ai` Module 2 — Prompt Engineering in Production (4 lessons + assignment, all
      built fresh to the full standard: system prompts/injection, few-shot, structured output
      with Pydantic, and a testing lesson. Assignment: "A Prompt Regression Test Harness" —
      scores two prompt versions against a shared eval set and flags per-case regressions.
      `module.json` status flipped to `"available"`.)
- [x] Retrofit `python-backend` Module 2 — `python-type-system` (all 5 lessons: 5-tier
      exercises + gotchas added; assignment left as-is, it already met the "real project" bar
      as the protocol-based repository refactor of the Task API)
- [x] Build `gen-ai` Module 3 — Tool/Function Calling (4 lessons + assignment, built fresh to
      the full standard: defining tool schemas, the bounded call-execute-respond loop, safe
      whitelist/validate/confirm dispatch, and a multi-tool assistant with graceful failure
      handling. Assignment: "A Safe Support Ops Assistant" — three chained tools with a
      confirmation gate on the destructive one. `module.json` status flipped to `"available"`.)
- [x] Retrofit `python-backend` Module 3 — `python-project-tooling` (all 5 lessons: 5-tier
      exercises + gotchas added; assignment left as-is, it already met the "real project" bar
      as the production-ready uv/src-layout/Ruff/mypy/pytest project skeleton)
- [x] Build `gen-ai` Module 4 — Embeddings and Semantic Search (4 lessons + assignment, built
      fresh to the full standard: what embeddings represent, cosine similarity, a minimal
      in-memory vector store vs. a real vector database, and chunking+indexing a real document
      set. Assignment: "A Semantic FAQ Search CLI" — chunks and embeds a 5-topic FAQ corpus with
      a persistent hash-keyed cache, serves ranked top-k queries with a relevance floor, and
      scores itself against a fixed eval set. `module.json` status flipped to `"available"`.)
- [x] Retrofit `python-backend` Module 4 — `pydantic-foundations` (all 4 lessons: 5-tier
      exercises + gotchas added; assignment left as-is, it already met the "real project" bar
      as the Task API's request/response/settings schema boundary)
- [x] Build `gen-ai` Module 5 — Retrieval-Augmented Generation (4 lessons + assignment, built
      fresh to the full standard: why RAG vs. fine-tuning/long-context, chunking strategy
      beyond Module 4's basic character chunker, the retrieve-then-generate pipeline with
      citations and a two-layer refusal path, and a dual-metric evaluation harness that
      separates retrieval failures from generation failures. Assignment: "A Grounded Docs Q&A
      Tool" — cited answers over Module 4's FAQ corpus with a retrieval-accuracy +
      groundedness-rate eval harness. `module.json` status flipped to `"available"`.)
- [x] Retrofit `python-backend` Module 5 — `fastapi-basics` (all 5 lessons: 5-tier exercises +
      gotchas added; assignment left as-is, it already met the "real project" bar as the Task
      API's FastAPI HTTP adapter)
- [x] Build `gen-ai` Module 6 — Agents and Workflows (4 lessons + assignment, built fresh to the
      full standard: chains vs. agents, plan/act/observe loop design with turn/cost/repetition
      stopping conditions, working-state extraction vs. history compression, and debugging via
      structured per-turn tracing plus dispatch-level guardrails. Assignment: "A Bounded Support
      Resolution Agent" — extends Module 3's ops assistant with a fourth tool, all three
      stopping conditions, working-state facts, a replayable trace log, and a refund-amount
      guardrail at dispatch. `module.json` status flipped to `"available"`.)
- [x] Retrofit `python-backend` Module 6 — `fastapi-intermediate` (all 5 lessons: 5-tier
      exercises + gotchas added; assignment left as-is, it already met the "real project" bar
      as the production-shaped dependency/lifespan/pagination retrofit of the Task API routes)
- [x] Build `gen-ai` Module 7 — Memory, Context Management, and Long Conversations (4 lessons +
      assignment, built fresh to the full standard: context-window budgeting and truncation
      risk, incremental rolling summarization, cross-session persistent memory with
      similarity-driven staleness handling reusing Module 4/5's retrieval mechanism, and
      cost/latency budgeting with model routing and caching. Assignment: "A Long-Conversation
      Memory Manager" — combines token-budgeted truncation, pinned facts, rolling summary,
      persistent per-user memory with upsert, and per-session cost tracking into one CLI tool.
      `module.json` status flipped to `"available"`.)
- [x] Retrofit `python-backend` Module 7 — `fastapi-advanced` (all 5 lessons: 5-tier exercises +
      gotchas added; assignment left as-is, it already met the "real project" bar as the
      auth/authorization/uploads/versioning/testing capstone for the Task API)
- [x] Build `gen-ai` Module 8 — The LangChain Ecosystem (4 lessons + assignment, built fresh to
      the full standard: the `Runnable`/LCEL interface mapped directly back to Module 2's
      hand-written request/parse code, retrievers/memory/tool-binding mapped back to Modules
      3/5/7 with explicit call-outs for what the framework does *not* automate (Module 7's
      memory policy, Module 6's stopping conditions), LangGraph modeling Module 6's agent loop
      as an explicit state graph, and LangSmith tracing/eval built on the same `Runnable`
      interface from Lesson 1. Assignment: "Port Your Hand-Built Agent to LangGraph +
      LangSmith" — reimplements Module 6's `resolution_agent.py` on LangGraph with tracing
      wired in and a required written comparison of what the framework bought versus what
      stayed the developer's responsibility. `module.json` status flipped to `"available"`.)
- [x] Retrofit `python-backend` Module 8 — `sqlalchemy-core` (all 5 lessons: 5-tier exercises +
      gotchas added; assignment left as-is, it already met the "real project" bar as the
      engine/session/unit-of-work foundation the Task API's persistence layer is built on)
- [x] Integrate the AI/ML Mastery Roadmap (2026-08-20). Stored verbatim at
      `content/roadmap/AI_ML_MASTERY_ROADMAP.md`; parsed by `lib/content/roadmapParser.ts` into
      `types/roadmap.ts` structures; rendered in full at `/roadmap/mastery` with all (then) 418 topic
      checkboxes wired into the existing progress store (and therefore Supabase sync); linked from
      the sidebar, the command palette, and `/roadmap`. `tests/roadmap.test.ts` guards against any
      topic being dropped. **Incomplete pending the truncated tail — see "Open questions" #1.**
- [x] Redesign the visual system + map the curriculum onto the roadmap (2026-08-20, same session).
      Design: new warm-graphite/ember/teal palette in both themes, Fraunces display headings, a
      three-blob aurora background, polished cards/buttons, custom scrollbar, and two new motion
      primitives (`components/motion/Reveal.tsx`, `AnimatedNumber.tsx`) applied to the home
      dashboard and the mastery roadmap. Structure: added optional `roadmapPhase`/`roadmapGroup`
      fields to the module schema (`lib/content/schema.ts`, `types/curriculum.ts`) and tagged 49 of
      68 existing modules with the roadmap phase/subsection they actually teach; `/roadmap/mastery`
      now shows linked modules (with live status) inline under each phase and subsection via
      `ModuleChips` in `components/roadmap/MasteryRoadmap.tsx`. Untagged modules (mostly
      `python-backend` 05-18) are deliberately outside the roadmap's scope — see `CONTENT_GUIDE.md`.
      Module build order now follows roadmap phase order — see the process note above.
- [x] Make the roadmap the spine, and rebuild the surfaces around it (2026-08-20, same session).
      Split `/roadmap/mastery` into a **phase hub** (`PhaseHub.tsx` — current phase spotlit, "next up"
      topic, 11-phase timeline, per-topic 3-pass controls, Proof Gate checkboxes) and
      `/roadmap/mastery/source` (`RoadmapDocument.tsx` — the verbatim text, unchanged). Added
      `lib/curriculum/phases.ts` (phase summaries + progress + current-phase logic, guarded by
      `tests/phases.test.ts`). Upgraded the progress store to **v2** with `topicPasses` (3-pass rule),
      `topicDates`, `proofGates`, and `sessions`, migrating v1 ticks to pass 3 automatically. Rebuilt
      the Command Center around a focus timer (four weekly lanes vs. the roadmap's cadence targets),
      a 3-week review queue, and a phase progress panel. Reordered `content/tracks.json` to phase
      order and added phase labels to track cards and skill-tree nodes. Readability pass: prose is
      now full-contrast (was muted) at 68ch/1.8, plus a lesson reading-progress bar.
- [x] Fold the roadmap into the curriculum, switch to sub-topic authoring, new favicon, real
      Supabase sync (2026-08-20, same session).
      **Curriculum:** scaffolded 17 modules and 2 new tracks (`ai-systems`, `ai-practice`) so every
      roadmap subsection has somewhere to write content — 85 modules, 7 tracks, guarded by a new
      coverage test. Restructured `numpy-arrays` to cover all ten topics of roadmap 1.2.
      **Authoring:** added per-lesson `status` (`lib/content/published.ts`) so one finished lesson
      publishes inside a still-planned module. **Sync:** pull-merge-push with an additive
      `mergeProgress`, plus lesson-note sync. **Favicon:** new ascending-bars mark.
- [x] Authored `numpy-arrays` Lesson 1 — "The ndarray Memory Model" (strides, contiguity,
      views vs. copies) to the full depth standard, published individually.
- [x] Re-verified the roadmap against a fresh paste (2026-08-20). Counted every section line by
      line: 44 sections matched exactly through 10.2. Found and fixed **two real defects in 10.3** —
      its last bullet had been stored truncated (missing "and to change your mind publicly"), and a
      whole bullet ("Teach: talks, workshops, mentoring.") was absent. Topic count 418 → **419**.
      Added three lessons to the `top-one-percent-behaviours` module so the recovered topics have a
      home. Hardened `tests/roadmap.test.ts` to strip HTML comments before counting, so editorial
      notes that quote topic text can never make the conservation test pass for the wrong reason.
- [x] **Rebuild the whole site around the roadmap document (2026-08-21).** Replaced the hand-curated
      13-group navigation with 13 groups generated from the roadmap itself: `phase-0` … `phase-10`,
      `cross-cutting-tracks`, `extra-learning`. Added `scripts/generateRoadmapCurriculum.ts` (47
      modules, 439 lessons, one per `- [ ]`, lesson id = roadmap topic id) and
      `npm.cmd run generate:roadmap`. Moved all 32 written/unique modules to Extra Learning keeping
      every lesson id (so no progress was lost), deleted 53 metadata-only outlines the roadmap now
      covers, and removed the four emptied storage tracks. Wired the roadmap's own prose, its 16
      `**Resource:**` blocks and its Proof Gates onto the group and module pages. New
      `tests/roadmapCurriculum.test.ts` (8 tests) locks curriculum to document in both directions;
      fixed the two pre-existing `phases.test.ts` failures.
- [x] **Rebuild the site as a practice-first system (2026-08-20).** The purpose changed: this is a
      gym and interview-prep system, not a reading site. Added the whole practice layer —
      `lib/practice/*` (YAML content model, Zod schema, server loader, build-time Shiki rendering,
      pure mastery engine and selectors), `components/practice/*` (a seven-mode workbench on the
      lesson route, progressive hints, self-scoring quizzes, interview cards, project briefs,
      revision drill, mastery panel), a `/practice` hub, and progress store **v3** with quiz scores,
      projects, reviewed interview questions and per-lesson practice dates. **Read
      `PRACTICE_SYSTEM.md` — it is the brief and the running state of this work.**
- [x] **Wrote module 1.1 / topic 1 — the Python data model (2026-08-20).** Deep lesson plus a
      22-exercise practice bank, checkpoint, 10-question assessment, 8 interview questions, a real
      project and a final challenge, and 5 verified resources. Published per-lesson inside the
      still-planned module. Made the roadmap generator merge-safe in the same pass.
- [x] **Wrote module 1.1 / topic 2 — iterators, generators, `yield from`, lazy evaluation
      (2026-08-20).** Same shape as topic 1: a deep lesson plus a 24-exercise practice bank,
      checkpoint, 10-question assessment, 8 interview questions, a streaming-pipeline project with a
      proven memory ceiling, and a nine-defect final challenge.
- [x] **Wrote module 1.1 / topic 3 — decorators, closures, functools (2026-08-20).** Same shape as
      topics 1 and 2: a deep lesson (cells and captured variables, the late-binding trap, decorators
      desugared to import-time function application, `wraps`/`__wrapped__`, parameterised and stacked
      decorators, `lru_cache`/`cache`/`cached_property`/`partial`/`singledispatch`, and why a
      class-based decorator breaks on a method without `__get__`) plus a 25-exercise practice bank,
      checkpoint, 10-question assessment, 8 interview questions, a six-decorator production toolkit
      project and a nine-defect final challenge, and 5 curated resources.
- [x] **Wrote module 1.1 / topic 4 — context managers and contextlib (2026-08-20).** Same shape as
      topics 1–3: a deep lesson (the protocol as an action paired with its undo, the full
      desugaring, what `as` binds, the `__exit__` return value and why suppression *abandons* the
      block, `@contextmanager` built on `gen.throw` and why the `try`/`finally` around the `yield`
      is a correctness requirement, single-use vs reusable vs reentrant, then `suppress`/`closing`/
      `nullcontext`/`chdir`/`ExitStack` with `pop_all`/`ContextDecorator`, and the async family)
      plus a 25-exercise practice bank, checkpoint, 10-question assessment, 8 interview questions,
      a resource-lifecycle toolkit project and a nine-defect final challenge, and 5 curated
      resources.
- [x] **Wrote `AUTHORING_PATTERN.md` (2026-08-20).** A self-contained specification of the content
      pattern — the two-file shape, the Learn/Practice/Debug/Interview/Test/Project/Review mapping,
      both schemas, every test-enforced limit and the target volumes — written so the pattern can be
      handed to any model (including ChatGPT) and continued without this repo's context. **Read it
      before authoring a topic**, and keep its reference-topic pointer current as topics ship.
- [ ] **← start here next session: module 1.1 / topic 5,
      `Type hints in depth: Generic, TypeVar, Protocol, Literal, overload`.**
      Same shape: `.mdx` plus `.practice.yaml`, published by flipping that one lesson to
      `"status": "available"`. Follow `AUTHORING_PATTERN.md` and `PRACTICE_SYSTEM.md` §
      "Per-topic definition of done", then work down module 1.1's remaining topics in the roadmap's
      order before touching any other module.
- [ ] Consider porting the relevant Extra Learning prose into roadmap lessons where it genuinely
      fits (e.g. `numpy-arrays` Lesson 1 "The ndarray Memory Model" is exactly roadmap topic
      `1.2` #1). The learner said they intend to rewrite everything, so **ask before reusing** —
      don't assume a copy is wanted.
- [ ] Ask the learner to run `supabase/schema.sql` in the Supabase SQL editor — sync cannot work
      until they do, and nothing in the app can do it for them (the anon key cannot create tables).

Historical note on the completed items above: they describe `python-backend` and `gen-ai` modules
that all still exist, unchanged, under **Extra Learning** — the 2026-08-21 rebuild moved them, it
did not rewrite them. The tracks they refer to (`ai-ml`, `ai-ml-maths`, `ai-systems`, `ai-practice`)
and the 13 hand-curated group names (`getting-started`, `mathematics`, `llm-engineering`, …) are
**gone**; don't orient from them. `content/groups.json`, `content/tracks.json` and the module
`module.json` files are the only ground truth.

## Before considering anything done

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

All four must pass. `npm.cmd run dev` + reading rendered HTML / server logs is the fallback for
visual QA since no browser tool is available here.

If you changed `content/roadmap/AI_ML_MASTERY_ROADMAP.md`, regenerate the curriculum first:

```powershell
npm.cmd run generate:roadmap
```
