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
pieces fit together, and `CONTENT_GUIDE.md` for the authoring contract (read that one in full
before writing or editing any lesson).

## Standing rules (do not relitigate these without the user asking)

- **Nothing is ever gated.** No "locked" modules, no forced sequencing, no daily-checklist
  pressure. Every track, module, and available lesson is always one click away, from the
  sidebar, the `/roadmap` skill tree, and the dashboard's "All Modules" section alike. A
  `"planned"` module (not yet written) is shown honestly as an outline, never as "locked."
- **Dark-first design.** Deep navy/charcoal, layered surfaces, restrained indigo/cyan accent
  glow, one coherent animated background. Light theme is preserved as an explicit toggle, not
  the default. Don't reintroduce a light-first look.
- **Content depth standard** (full text in `CONTENT_GUIDE.md`, top section) applies to every
  module built from here forward: beginner → advanced lessons with no shallow stop, five
  exercises per lesson tagged `difficulty="easy|medium|hard|interview|real-world"`, a
  `<Gotchas>` section with immediately-visible answers, and a real applied project for the
  assignment — not a toy. `tests/content.test.ts` enforces the five-tier + gotchas requirement
  automatically for every track except `python-backend`.
- **One module at a time, full depth.** Before moving to the next module, confirm all four
  pieces above exist for the one you just built. Don't scaffold five modules shallowly when the
  ask is one module done properly.
- **Voice: senior engineer teaching a fast learner, not a textbook.** Explain mental models the
  way an experienced developer would explain them to a smart junior — precise, opinionated,
  grounded in what actually goes wrong in production, not encyclopedic. The goal is a learner who
  comes out the other side thinking like a senior engineer, not one who memorized definitions.
- **Gen AI track includes a framework module.** Module 8, "The LangChain Ecosystem" (LangChain,
  LangGraph, LangSmith), sits after Agents/Workflows and Context/Memory and before Evaluation —
  by design, students build the raw mechanics by hand first (tool calling, RAG, agent loops,
  eval harnesses in Modules 3/5/6/2) and only then meet the framework that packages them, so the
  framework reads as "oh, that's what I already built" instead of magic.
- **Supabase sync is optional and intentionally minimal** (plain-text password match, no
  hashing, no email verification — see `supabase/schema.sql`). Never "improve" this into a real
  auth system unless explicitly asked. The app must work fully local-only with zero env vars set.
- **No browser/screenshot tool is available in this environment.** Visual QA is done via dev
  server + server logs + rendered-HTML structure checks + manual code review, not by looking at
  pixels. Say so explicitly when reporting back; don't imply you visually confirmed something
  you didn't.

## Status snapshot

| Track | Status | Modules available | Depth standard |
|---|---|---|---|
| `python-backend` | available | 15 / 18 | Modules 1–15 are authored; advanced Modules 16–18 are planned outlines. **The authored core is being retrofitted module by module**, interleaved with new `gen-ai` modules (see "Next up"). Modules 1–4 meet the new standard; Modules 5–15 still use the legacy format until their turn comes up. |
| `gen-ai` | available | 5 / 14 | Modules 1–5 are authored to the current standard. Modules 6–14 are planned, including LangChain/LangGraph/LangSmith, advanced RAG, multimodal AI, model adaptation, and MCP. |
| `python-libraries` | planned | 0 / 11 | All 11 modules are planned outlines; Modules 9–11 add SciPy, columnar analytics, and reproducible data workflows. |
| `ai-ml` | planned | 0 / 15 | All 15 modules are planned outlines, including NLP, vision, time series, ranking, and MLOps extensions. |
| `ai-ml-maths` | planned | 0 / 10 | All 10 modules are planned outlines, including numerical stability, information theory, graph maths, and advanced optimization. |

Shell/UI status: dark-first design system, animated background, glass sidebar, Ctrl/Cmd+K
command palette (`cmdk`), Command Center dashboard (Resume card, Learning Streak heatmap, Skill
Progress, All Modules overview), `/roadmap` skill tree (`@xyflow/react`, no gating), lesson page
with a contextual right rail (prerequisites, ToC, local notes), optional Supabase sync scaffolded
but not connected to a real project (no env vars set in this environment). All of this is built
and passes `lint`/`typecheck`/`test`/`build`.

## Open questions

None currently. (Resolved: the user confirmed the Python Backend track should be retrofitted to
the content depth standard, interleaved one-for-one with new-track work — see "Next up.")

## Next up

**Confirmed process: alternate one retrofit module with one new-track module, in that order,
every session.** Concretely:

1. Retrofit Python Backend Module 1 (`python-fundamentals`, 5 lessons + assignment) to the
   content depth standard.
2. Build Gen AI Module 2 (Prompt Engineering in Production) to the same standard.
3. Retrofit Python Backend Module 2 (`python-type-system`).
4. Build Gen AI Module 3 (Tool/Function Calling).
5. ...continue alternating: retrofit PB module N, build next net-new module, repeat, working
   through all 15 Python Backend modules while also working forward through Gen AI (then the
   other planned tracks) module by module.

Track progress through this list here as modules complete — check off / update this section
each time a module finishes so the alternation stays on track across sessions.

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
- [ ] Retrofit `python-backend` Module 5 — `fastapi-basics`
- [ ] Build `gen-ai` Module 6 — Agents and Workflows
- [ ] ...(continue this pairing through all 15 Python Backend modules and Gen AI module 7,
      then **Gen AI Module 8 — The LangChain Ecosystem** (LangChain, LangGraph, LangSmith; see
      the standing rule above for why it's sequenced there), then Gen AI 9–10, then move on to
      Python Libraries, AI/ML, and Maths in the same alternating style)

Gen AI track numbering note: Module 8 "The LangChain Ecosystem" was inserted after this track was
first scaffolded, which shifted the old Modules 8/9 ("Evaluation, Safety, and Guardrails" and the
capstone "Shipping a Gen AI Feature") to 9/10. If you're orienting from an older summary that
mentions "Gen AI Module 8 = Evaluation" or "Module 9 = capstone," that's stale — check
`content/tracks.json` and each track's `module.json` `number` field as ground truth, not memory.

Curriculum expansion note (2026-08-09): an all-track documentation audit added 19 planned modules
and 90 lesson-topic outlines. The platform now contains 68 modules total: Python Backend 18,
Python Libraries 11, Gen AI 14, AI/ML 15, and Maths 10. These are metadata-only plans and must
remain `"planned"` until their lessons and assignments meet `CONTENT_GUIDE.md`.

## Before considering anything done

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

All four must pass. `npm.cmd run dev` + reading rendered HTML / server logs is the fallback for
visual QA since no browser tool is available here.
