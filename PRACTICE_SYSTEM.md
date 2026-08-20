# PRACTICE_SYSTEM.md — the practice-first rebuild

**Read this together with `CLAUDE.md`, `CONTENT_GUIDE.md` and `ARCHITECTURE.md`.**
This file is the brief for the change of purpose the owner asked for on **2026-08-20**, plus the
architecture decided for it and the exact state of the work. It exists so the next session — on
this machine or any other — can continue without being told anything again.

---

## 1. The change of purpose (owner's words, condensed but not softened)

This site is **no longer a tutorial/reading website**. It is:

> **My personal programming gym + laboratory + interview preparation system.**

It is used to: learn topics deeply, practise programming, test knowledge, prepare for interviews,
solve tricky problems, build small and medium projects, experiment with concepts, and revise later.

The single most important behaviour:

```text
Pick ONE module -> pick ONE topic -> go very deep -> teach it -> make me practise it
-> challenge me -> test me -> make me build something -> verify mastery -> only then move on
```

**Depth beats speed. Never generate shallow content across many modules at once.**

### Hard rules from the brief

- **One module at a time. Inside it, one topic at a time, finished completely.** A topic is
  finished only when it has theory, examples, exercises, tricky questions, debugging, interview
  questions, a test, resources, and its project/challenge. Only then start the next topic.
- **Question quality over quantity.** No repetitive questions that differ only in variable names.
  Difficulty must come from understanding, never from confusing wording. Do not mass-generate.
- **Never show solutions immediately.** The flow is
  `Question -> my attempt -> Hint 1 -> Hint 2 -> Hint 3 -> Solution -> Explanation`.
- **Mastery must be earned.** Opening a page never marks anything mastered. Mastery depends on
  actual exercise/test performance, and the rules stay configurable.
- **Projects must be realistic.** No calculators, no basic todo lists, no student-management CRUD.
  Prefer real developer problems. Don't force a project onto a topic that doesn't justify one —
  combine related topics instead.
- **Explain Python-specific behaviour and internals properly**, comparing to JavaScript/TypeScript
  where the difference is illuminating (the owner's background is Node/TS/Express/Postgres/Redis/Kafka).
- **Resources must be curated, verified and justified** — a small number of excellent free primary
  sources, each with a stated reason, not an SEO link dump.
- **No paid AI APIs in the core loop.** Static curated content must work standalone. AI features,
  if ever added, are optional enhancements.
- **Preserve existing work.** Reuse the existing architecture, design system and components.
  Refactor only where it improves maintainability. Do not rebuild from scratch.
- Keep TypeScript strict, avoid `any`, no giant components, no placeholder buttons, no fake
  functionality, no console errors, keep the build green.

### Reasonable per-topic volume (owner's own starting figures)

5–10 basic/practical exercises · 5 intermediate · 3–5 tricky · 5–10 interview questions ·
3 debugging exercises · 1 assessment · 1 appropriate project or challenge.
Scale up for a major topic, down for a tiny one. **Judgement, not a quota.**

---

## 2. What was already here (inspection result, do not re-derive)

- **Next.js 16 App Router, `output: "export"` (fully static), `trailingSlash: true`.** No server at
  runtime — everything interactive must be client-side, everything else is built at build time.
- **Content boundary** is `lib/content/loader.ts` (`server-only`): reads `content/tracks.json`,
  `content/groups.json`, and `content/modules/<track>/<NN-slug>/module.json`, all Zod-validated in
  `lib/content/schema.ts`. Lesson prose is MDX beside `module.json`, compiled by `next-mdx-remote/rsc`.
- **Routes**: `/`, `/learn`, `/paths/[groupSlug]`, `/learn/[moduleSlug]`,
  `/learn/[moduleSlug]/[lessonSlug]`, `/roadmap`, `/roadmap/mastery`, `/roadmap/mastery/source`,
  `/account`. Module slugs and lesson ids are globally unique, so routes carry no track segment.
- **Progress** is `lib/progress/progress.ts` + `components/progress/ProgressProvider.tsx`:
  a versioned localStorage store (`PROGRESS_KEY = "python-backend-learning-progress:v1"`, data
  `version: 2`) exposed through `useSyncExternalStore`, with optional pull-merge-push Supabase sync.
  `mergeProgress` is **additive by design** — never make it last-writer-wins.
- **MDX teaching blocks** live in `components/mdx/blocks.tsx`: `Callout`, `Concept`, `WhyItMatters`,
  `TypeScriptComparison`, `CommonMistake`, `ProductionNote`, `Checkpoint`, `FurtherReading`,
  `CodeExample`, `Exercise`, `Solution`, `Assignment`, `Gotchas`, `Gotcha`, plus `CopyCodeBlock`.
- **Design system** is plain CSS custom properties at the top of `app/globals.css` (dark-first warm
  graphite, `--accent` ember, `--accent-cyan` teal, Fraunces display headings). Components use
  semantic class names defined in that one file. **Never hardcode colours in components.**
- Server-highlighted code uses Shiki dual themes and the `--shiki-light` / `--shiki-dark` CSS
  variable convention (see `app/globals.css` lines ~299–300). New code surfaces must match it.
- **Curriculum is generated** from `content/roadmap/AI_ML_MASTERY_ROADMAP.md` by
  `scripts/generateRoadmapCurriculum.ts` into `content/groups.json` + `content/modules/mastery/**`
  (47 modules, 439 lessons, one lesson per `- [ ]` checkbox, lesson `id` = roadmap topic id).

### Constraints discovered that will bite you

1. **`tests/roadmapCurriculum.test.ts` currently forbids exactly what we are about to do.**
   Its test "written content lives in Extra Learning, and no generated module claims to be written"
   asserts that any module directory containing an `.mdx` file is in `extra-learning`, and that
   every roadmap module has `status: "planned"`. That encoded the old "nothing on the roadmap is
   written yet" state. It **must be relaxed** to: a module with prose is either in Extra Learning,
   or a roadmap module whose written lessons carry `"status": "available"`. Keep the rest of the
   test — it is what stops the curriculum drifting from the document.
2. **`tests/content.test.ts` applies the five-tier + gotchas standard to every `NN-*.mdx` outside
   `python-backend`.** So every new mastery lesson MDX needs all five `difficulty="…"` tiers, a
   `<Gotchas>` block, a Checkpoint, a Summary, at least 250 words, and **no prose paragraph over
   70 words**. Treat these as a floor, not the target.
3. ~~`scripts/generateRoadmapCurriculum.ts` rebuilds `content/modules/mastery/` from scratch~~
   **Fixed 2026-08-20.** The generator now snapshots authored work before the rebuild and merges it
   back: every non-`module.json` file is restored, and authored lesson fields (`status`,
   `description`, `learningObjectives`, a non-placeholder `estimatedMinutes`) are merged **by lesson
   id**, which is the only key stable across a regeneration. A module's `estimatedMinutes` is now
   the sum of its lessons rather than a flat multiple. If a roadmap heading is renamed so a module
   slug disappears, the script **aborts before deleting anything** and tells you which files would
   have been orphaned. Verified by regenerating and diffing: authored files came back byte-identical.
   `npm.cmd run generate:roadmap` is therefore safe to re-run — but read its summary line.
4. Zod 4: `.default({})` on an object schema needs the full output type — use `.prefault({})`.

---

## 3. Architecture decided for the practice layer

### 3.1 Content format — YAML beside the MDX

```text
content/modules/mastery/03-1-1-python-fluency-beyond-the-basics/
  module.json
  01-data-model-dunder-methods-descriptors-slots.mdx            <- teaching (Learn mode)
  01-data-model-dunder-methods-descriptors-slots.practice.yaml  <- everything else
```

**Why YAML, not MDX or JSON.** Practice content has to be *queried* (random challenge, weak-topic
review, cross-topic revision) and *scored* (mastery), neither of which works if hints and answers
are compiled JSX. JSON was rejected because every field here is prose or code and escaping it is
unmaintainable; YAML block scalars (`|`) hold multi-line Python with zero escaping, and `yaml` is
already a project dependency. Prose stays in MDX because prose is what MDX is good at.

### 3.2 Files

| File | Role | State |
|---|---|---|
| `lib/practice/types.ts` | TS model for the whole practice layer | **written** |
| `lib/practice/schema.ts` | Zod validation of `*.practice.yaml` | **written** |
| `lib/practice/mastery.ts` | stages, statuses, `computeMastery`, quiz grading — pure | **written** |
| `lib/practice/select.ts` | revision queue, weak topics, random challenge — pure | **written** |
| `lib/practice/loader.ts` | `server-only` YAML loader, plus the stripped `getPracticeIndex()` the hub runs on | **written** |
| `lib/practice/render.ts` | Shiki highlighting of every code field at build time | **written** |
| `components/practice/*` | `Workbench` (mode tabs), `ExerciseCard`, `HintStack`, `QuizRunner`, `InterviewCard`, `ProjectPanel`, `ResourceList`, `MasteryPanel`, `RevisionDrill`, `CodePanel`, `RichText`, `useDraft`, `useReport`, `LessonMastery`, `PracticeHub` | **written** |
| `app/practice/page.tsx` | the practice hub (challenge, revision, weak topics, mastery by topic) | **written** |
| `tests/practice.test.ts` | mastery + selection + authored-content depth tests (13) | **written** |

Also done: progress store bumped to **v3** with migration and additive merge (`lib/progress/progress.ts`,
`components/progress/ProgressProvider.tsx`, 3 new tests in `tests/progress.test.ts`); the practice
CSS appended to `app/globals.css`; `/practice` added to the sidebar and the command palette; the
lesson route wired to render `<Workbench>` when a practice set exists and the plain prose when not;
and the `tests/roadmapCurriculum.test.ts` relaxation described in section 2.

### 3.3 The content model (already in `lib/practice/types.ts`)

- `PracticeExercise` — `tier: normal | intermediate | tricky | challenge`,
  `kind: write-code | predict-output | debug | refactor | code-reading | explain | design | performance`,
  `hints[]` (progressive), `solution`, `solutionCode?`, `explanation?`, `concepts[]`, `minutes`,
  `requiredForMastery`.
  **Debugging practice and code-reading practice are exercises with a `kind`, not separate types** —
  one authoring shape, filtered into their own surfaces. That is deliberate; do not fork it.
- `Quiz` — `kind: checkpoint | assessment`, `passScore`, and `QuizQuestion`s covering
  mcq / multi / true-false / predict-output / find-bug / complete-code / explain / write-function /
  refactor / performance / scenario. Open questions carry a `modelAnswer` and are self-graded.
- `InterviewQuestion` — `level`, `shortAnswer` (what you say in the room), `fullAnswer` (the mental
  model), `commonWrongAnswer`, `followUps[]`.
- `ProjectBrief` — `kind: micro | small | major | final-challenge`, problem, requirements,
  constraints, expected behaviour, optional folder tree, milestones, testing, failure cases, bonus,
  `architectureHints[]` (revealed on request) and a `referenceOutline` hidden hardest of all.
- `Resource` — name, type, difficulty, url, **why**, **covers**, usefulness 3–5 (below 3 = don't add).
- `MasteryRules` — `minAssessmentScore` (default 80), `requireProject`, `requireInterview`,
  `requireDebug`, `revisitAfterDays` (default 21). Per-lesson overridable, as the brief asked.
- `Rendered*` variants replace each code string with `{ code, html, language }` after Shiki runs.

### 3.4 Mastery model (already in `lib/practice/mastery.ts`)

Stages: `learn -> examples -> practice -> debug -> interview -> test -> project`.
"Review" is intentionally **not** a stage — it is the state a finished topic falls back into after
`revisitAfterDays`, expressed as the `needs-review` status and the revision queue.

Statuses: `not-started -> learning -> practicing -> completed -> mastered`, plus `needs-review`.

- `completed` = learn + required practice + assessment at or above the pass mark.
- `mastered` = every applicable stage complete.
- A stage with `total = 0` is **inapplicable and dropped from the percentage**, never counted as a
  free win.
- A mastered/completed topic older than `revisitAfterDays` is demoted to `needs-review`.

### 3.5 Progress store — bump to v3

Add to `ProgressData` (keep `PROGRESS_KEY` unchanged; migrate v1 and v2 in `parseProgress`):

```ts
quizScores: Record<string, { best: number; attempts: number; lastAt: string }>;
completedProjects: string[];
reviewedInterview: string[];
lessonDates: Record<string, string>;   // lessonId -> YYYY-MM-DD, feeds spaced revision
```

`mergeProgress` must stay **additive**: union the arrays, keep the *higher* quiz score and the
*later* `lastAt`, keep the later `lessonDates` entry. Extend `tests/progress.test.ts` accordingly.

### 3.6 UI — modes as tabs on the existing lesson route

No new route per mode (static export, and it would fragment progress). The lesson page renders a
`<Workbench>` client component and **passes the server-rendered MDX in as a prop**, so:

`Learn` (the MDX) · `Practice` · `Debug` · `Interview` · `Test` · `Project` · `Review`

The Learn panel stays mounted (hidden) so the table of contents and reading-progress bar keep
working. Mode is deep-linkable through the URL hash (`#practice`) — hash, not a query param,
because `useSearchParams` forces a Suspense boundary under static export.

`app/practice/page.tsx` is the cross-topic hub: revision queue, weak topics, random challenge,
interview drill, and mastery status for every authored topic. All client-computed from the store.

New CSS goes at the end of `app/globals.css` in the existing compact one-line style, using the
existing custom properties only.

---

## 4. Where the content work starts

**Module 1 = `content/modules/mastery/03-1-1-python-fluency-beyond-the-basics/`**
(roadmap section 1.1, module `number: 3`, group `phase-1`).

**Assumption on record:** the roadmap's first two modules are Phase 0, which is a "skip" checklist
and a self-audit — a diagnostic the learner performs, not teaching material. So authoring starts at
**1.1**, exactly as `CLAUDE.md`'s "Next up" option (b). If the owner would rather turn Phase 0's
self-test into a diagnostic quiz first, say so and it moves to the front of the queue.

### Topic order inside module 1.1 (the roadmap's own wording, do not paraphrase)

1. ~~`Data model: __dunder__ methods, descriptors, __slots__`~~ **done 2026-08-20**
2. ~~`Iterators, generators, yield from, lazy evaluation`~~ **done 2026-08-20**
3. ~~`Decorators, closures, functools (lru_cache, partial, wraps)`~~ **done 2026-08-20**
4. ~~`Context managers and contextlib`~~ **done 2026-08-20**
5. `Type hints in depth: Generic, TypeVar, Protocol, Literal…`  <- **start here**
6. …through topic 12. Read `module.json` for the full list; **keep every lesson `id` unchanged** —
   it is the roadmap topic id and it carries the 3-pass progress.

### Per-topic definition of done

- [ ] `module.json` lesson entry gains `description`, real `learningObjectives`, honest
      `estimatedMinutes`, and `"status": "available"`.
- [ ] `<slug>.mdx` — deep teaching: what it is, why it exists, the problem it solves, how it works
      internally, syntax, rules, patterns, real-world usage, performance, mistakes, edge cases, best
      practice; examples progressing **basic -> practical -> advanced -> edge case**; TS/JS contrast
      where it illuminates; five-tier `<Exercise>`s; `<Gotchas>`; Checkpoint; Summary.
- [ ] `<slug>.practice.yaml` — exercises across all four tiers with progressive hints, debugging
      exercises, code-reading exercises, interview questions with short + full + wrong answers +
      follow-ups, checkpoint quizzes, one assessment, the project or final challenge, and the
      curated verified resources.
- [ ] `npm.cmd run lint && npm.cmd run typecheck && npm.cmd test && npm.cmd run build` all green.
- [ ] This file's "Progress log" updated, and `CLAUDE.md` "Next up" updated.

The topic-1 lesson should cover, at minimum: the data model as a protocol system (vs. TS interfaces
and JS prototypes); special-method lookup on the **type**, not the instance; `__new__` vs `__init__`;
`__repr__`/`__str__`/`__format__`; the `__eq__`/`__hash__` contract and how defining `__eq__` sets
`__hash__` to `None`; ordering and `functools.total_ordering`; the container protocol and the
`__getitem__` iteration fallback; truthiness; operators, reflected operators and `NotImplemented`;
`__getattr__` vs `__getattribute__`; descriptors (`__get__`/`__set__`/`__set_name__`, data vs
non-data precedence, why functions/`property`/`classmethod` are descriptors); `__slots__` (memory
layout, no `__dict__`, inheritance rules, weakref, when it backfires). Ground it in what the learner
is heading toward: PyTorch `Dataset.__len__`/`__getitem__`, tensor `__matmul__`, Pydantic and
SQLAlchemy descriptors, `__slots__` on hot-path records.

---

## 5. Validation — all four must pass before anything is called done

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

There is **no browser or screenshot tool in this environment.** Visual QA is dev server + server
logs + rendered-HTML structure checks + code review. Say so when reporting; never imply otherwise.

---

## 6. Progress log

Append one entry per completed topic. Never delete entries.

- **2026-08-20 — planning.** Repo inspected end to end; the architecture above agreed and written
  down here.
- **2026-08-20 — practice infrastructure complete.** Every file in the section 3.2 table exists,
  progress is on v3, `/practice` is live and in navigation, and the lesson route renders the
  workbench. `lint`, `typecheck`, `test` (69) and `build` all pass. The content-depth tests in
  `tests/practice.test.ts` currently pass vacuously — there is no practice file on disk yet — and
  will start enforcing the moment the first one lands. **No content authored yet.**
  Next: **module 1.1 / topic 1**, `Data model: __dunder__ methods, descriptors, __slots__`.
- **2026-08-20 — module 1.1, topic 1 complete: the Python data model.**
  `content/modules/mastery/03-1-1-python-fluency-beyond-the-basics/01-data-model-dunder-methods-descriptors-slots.{mdx,practice.yaml}`,
  published via `"status": "available"` on that lesson only.

  The lesson covers protocol-vs-interface (with the TS/JS contrast), special-method lookup on the
  type, `__new__`/`__init__`, the repr family, the equality/hash contract, ordering, the container
  protocol and the `__getitem__` iteration fallback, truthiness, operators with `NotImplemented`
  and reflection, `__getattr__` vs `__getattribute__`, descriptors including the data/non-data
  precedence ladder, and `__slots__` with its real costs — grounded in PyTorch `Dataset`,
  SQLAlchemy/Pydantic descriptors and hot-path records.

  The practice bank: **24 exercises / 53 hints** — by tier, 7 normal, 8 intermediate, 7 tricky,
  2 challenge; by kind, 9 write-code, 6 predict-output, 4 debug, 2 code-reading, 2 design, 1 explain
  (kind and tier are independent axes, so the debugging and code-reading problems sit inside the
  tier counts). Plus a 4-question checkpoint and a **10-question assessment** mixing
  mcq/multi/true-false/predict-output/find-bug/explain/write-function/refactor/scenario;
  **8 interview questions** with short answer, full model, common wrong answer and follow-ups; a
  3-hour **project** (build the descriptor/slots machinery behind Pydantic and SQLAlchemy, standard
  library only) and a **final challenge** (one legacy class, eleven data-model defects to find and
  fix); and **5 curated resources**, every URL checked with a real request for HTTP 200 at
  authoring time.

  The generator was made merge-safe in the same pass (see constraint 3 above), and
  `tests/practice.test.ts` now enforces the depth bar against real content rather than vacuously.
  `lint`, `typecheck`, `test` (69) and `build` (237 static pages) all pass.

  **Next: module 1.1 / topic 2, `Iterators, generators, yield from, lazy evaluation`.**
- **2026-08-20 — module 1.1, topic 2 complete: iterators, generators, `yield from`, laziness.**
  `02-iterators-generators-yield-from-lazy-evaluation.{mdx,practice.yaml}`, published per-lesson.

  The lesson covers iterable vs iterator (and why that distinction *is* the exhaustion bug), the
  protocol written by hand then collapsed into a generator, suspended frames as state machines,
  `send`-based consumers, the full cost side of laziness, `yield from` as a bidirectional
  delegation channel carrying `StopIteration.value`, PEP 479, `GeneratorExit` and deterministic
  cleanup, and the `itertools` vocabulary — including the two functions (`tee`, `groupby`) that
  quietly break the guarantee you thought you had. Grounded in streaming training pipelines,
  `IterableDataset` and `@contextmanager`.

  The practice bank: **24 exercises / 51 hints** — by tier, 7 normal, 9 intermediate, 6 tricky,
  2 challenge; by kind, 6 write-code, 6 predict-output, 4 debug, 2 code-reading, 2 design,
  2 explain, 1 refactor, 1 performance. A 4-question checkpoint and a **10-question assessment**;
  **8 interview questions** spanning basic through internals, tricky, comparison, debugging and
  scenario; a 3-hour **project** (a streaming record pipeline with a memory ceiling you must prove
  with `tracemalloc`, atomic output and resumability) and a **final challenge** (nine laziness
  defects to find in a real-shaped ETL module); **5 curated resources**, all URL-checked for 200.

  Worth recording: `tests/practice.test.ts` caught this topic shipping with only two debugging
  exercises and refused it until a third and fourth were written. The depth bar is doing its job.

  `lint`, `typecheck`, `test` (69) and `build` (238 static pages) all pass.

  **Next: module 1.1 / topic 3, `Decorators, closures, functools (lru_cache, partial, wraps)`.**

- **2026-08-20 — module 1.1, topic 3 complete: decorators, closures, functools.**
  `03-decorators-closures-functools-lru-cache-partial-wraps.{mdx,practice.yaml}`, published per-lesson.

  The lesson covers closures as cells over an enclosing frame (with `__closure__`/`co_freevars`
  inspected directly), the late-binding trap and its three fixes, decorators desugared to plain
  function application at import time, what a wrapper destroys and what `functools.wraps` restores
  including `__wrapped__`, parameterised decorators and the parentheses-optional pattern, stacking
  order (bottom-up application, top-down execution), then `lru_cache`/`cache`, `cached_property`,
  `partial`, `singledispatch`, class-based decorators and why they break on methods without
  `__get__`. Grounded in `torch.no_grad`, FastAPI/pytest registration decorators and LLM embedding
  caches.

  The practice bank: **25 exercises / 51 hints** — by tier, 7 normal, 9 intermediate, 7 tricky,
  2 challenge; by kind, 8 write-code, 5 debug, 4 predict-output, 3 design, 2 code-reading, 1 explain,
  1 refactor, 1 performance. A 4-question checkpoint and a **10-question assessment** mixing
  predict-output/find-bug/mcq/true-false/explain/write-function/refactor/scenario/performance;
  **8 interview questions** across basic, intermediate, advanced, comparison, internals, tricky and
  scenario; a 3-hour **project** (a six-decorator production toolkit that must survive
  `mypy --strict`, methods, generators and threads, with the "what it does not guarantee" README as
  the real deliverable) and a **final challenge** (one decorators module, nine defects, two of them
  silent); **5 curated resources** (PEP 318, `functools`, the execution model reference, PEP 612,
  `inspect`).

  `lint`, `typecheck`, `test` (69) and `build` all pass. No browser tool here, so the page was
  verified by reading the exported HTML, not by looking at it.

  **Next: module 1.1 / topic 4, `Context managers and contextlib`.**

- **2026-08-20 — module 1.1, topic 4 complete: context managers and contextlib.**
  `04-context-managers-and-contextlib.{mdx,practice.yaml}`, published per-lesson.

  The lesson covers the protocol as a pairing of an action with its undo, the full desugaring
  (including why the strict form uses `except`/`else` rather than `finally`), what `as` binds, the
  `__exit__` return value and the fact that suppression *abandons* the block rather than resuming
  it, `@contextmanager` built on `gen.throw` and why the `try`/`finally` around the `yield` is a
  correctness requirement, single-use versus reusable versus reentrant, then `suppress`, `closing`,
  `nullcontext`, `chdir`, `ExitStack` with `enter_context`/`callback`/`pop_all`, `ContextDecorator`,
  and the async family with `asynccontextmanager`/`AsyncExitStack`. Grounded in `torch.no_grad`,
  FastAPI `lifespan`, SQLAlchemy `Session.begin`, `pytest.raises` and connection pools.

  The practice bank: **25 exercises / 50 hints** — by tier, 7 normal, 9 intermediate, 7 tricky,
  2 challenge; by kind, 8 write-code, 5 debug, 4 predict-output, 2 explain, 2 code-reading,
  2 design, 1 refactor, 1 performance. A 4-question checkpoint and a **10-question assessment**
  mixing mcq/predict-output/find-bug/true-false/explain/write-function/refactor/scenario/performance;
  **8 interview questions** across basic, intermediate, advanced, tricky, scenario and comparison;
  a 3-hour **project** (a resource-lifecycle toolkit whose real deliverable is a test suite written
  against the exception paths *first*, and which includes one requirement that is deliberately
  impossible — a retry *manager* — because noticing why is the point) and a **final challenge**
  (one resources module, nine defects, three of them silent); **5 curated resources** (PEP 343,
  `contextlib`, the `with` statement reference, the data model's context-manager section, PEP 492),
  every URL checked for HTTP 200 at authoring time.

  Also written this session: **`AUTHORING_PATTERN.md`**, a self-contained specification of this
  content pattern — the two-file shape, the six-mode mapping, both schemas, every enforced limit and
  the target volumes — so the pattern can be handed to any model, including ChatGPT, and continued
  without this repo's context.

  `lint`, `typecheck`, `test` (69) and `build` all pass. No browser tool here, so the page was
  verified by reading the exported HTML (all seven mode tabs present), not by looking at it.

  **Next: module 1.1 / topic 5, `Type hints in depth: Generic, TypeVar, Protocol, Literal, overload`.**
