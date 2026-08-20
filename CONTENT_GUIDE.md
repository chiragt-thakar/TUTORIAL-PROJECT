# Content guide

The site treats curriculum metadata and lesson prose as three layers: `content/tracks.json` groups modules into tracks; `module.json` controls a module's ordering and availability within its track; `.mdx` files contain long-form teaching. All IDs are persisted in learner progress, so stability matters.

## Content depth standard

This is the bar every module must clear before it ships as `"available"`. Depth comes before anything else in this guide — a module that's technically valid but shallow doesn't count as done. A module is complete only when all four of these exist:

1. **Structured lessons, beginner → advanced, no shallow stop.** The first lesson can assume nothing; the last lesson in the module should be genuinely advanced for that topic — not a repeat of the intro at a slightly faster pace. If a module's honest depth needs six lessons instead of four, write six.
2. **A real exercise progression: Easy → Medium → Hard → Interview → Real World.** Every lesson needs one `<Exercise>` at each of the five tiers, tagged with the `difficulty` prop (`easy`, `medium`, `hard`, `interview`, `real-world`) so the UI renders the tier badge. Easy checks the lesson's core fact. Medium applies it with a twist. Hard combines it with something from an earlier lesson. Interview matches the shape of a real interview question on the topic (and should read like one). Real World is grounded in an actual production scenario, not an abstract puzzle.
3. **A dedicated tricky/gotcha-questions section**, wrapped in `<Gotchas>` with one or more `<Gotcha question="...">` entries whose answers are visible immediately (not hidden behind a reveal) — these are the "wait, really?" surprises and common misconceptions for the topic, each with a short, direct, correct explanation.
4. **A real applied project**, not a toy. The module's `assignment.mdx` should produce something a working engineer would recognize as a legitimate small deliverable — wired into the cumulative project where the track has one — not a contrived exercise dressed up as an assignment.

Confirm all four exist for a module before starting the next one. `npm.cmd test` enforces pieces of this automatically for tracks other than `python-backend` (see `tests/content.test.ts`); the rest is a manual read-through.

**The Python Backend core (modules 1–15) predates this standard** and originally shipped in a legacy format: three unlabeled exercises per lesson, no dedicated gotchas section. That core is being retrofitted to the standard above, one module at a time, interleaved with new-track work (see `CLAUDE.md` for the current module-by-module status). `npm.cmd test` does not require the five-tier/gotchas shape for `python-backend` — see the exemption in `tests/content.test.ts` — so a not-yet-retrofitted module still passes; the exemption stays in place even after a module is retrofitted, since it's a floor, not a ceiling. Python Backend Modules 16–18 and every other module built from here forward follow the standard above from day one.

## Navigation groups vs. tracks

Two different things, easy to confuse:

- **Track** (`content/tracks.json`, `content/modules/<track>/`) — **storage only.** It decides which
  directory a module's files live in, and the loader still rejects a module whose `track` field
  doesn't match its directory. Tracks appear in the UI in exactly one place: as the sub-headings
  inside Extra Learning, which keep the three original curricula from interleaving.
- **Group** (`content/groups.json`, the module's `group` field) — **the navigation unit.** There is
  one group per phase of the mastery roadmap, in the document's own order, then `cross-cutting-tracks`,
  then `extra-learning`. The sidebar, `/learn`, `/paths/<group>`, the skill tree, and the command
  palette are all built from them.

A module declares both: `track` for where it is stored, `group` for where it appears.

**`content/groups.json` and everything under `content/modules/mastery/` are generated.** They are
written by `scripts/generateRoadmapCurriculum.ts` directly from the roadmap markdown — do not
hand-edit them; edit the roadmap and re-run `npm.cmd run generate:roadmap`.
`tests/roadmapCurriculum.test.ts` fails if the two fall out of step.

## The generated roadmap curriculum

The mapping from document to site is one-to-one and deliberately mechanical:

| Roadmap | Site |
|---|---|
| `## PHASE 4 — Deep Learning Foundations \`[CORE]\` — 3 months` | group `phase-4`, titled "Phase 4 — Deep Learning Foundations", with `tag` and `duration` as chips |
| `### 4.2 Training dynamics — the part that makes you employable` | module `4-2-training-dynamics`, titled "4.2 Training dynamics — …" |
| `- [ ] Vanishing and exploding gradients` | one lesson, titled with that exact text |
| `> **Resource:** …` | the "What to read for 4.2" block on that module's page |
| `**Proof Gate — Phase 4:** …` | the Proof Gate callout on `/paths/phase-4` |
| `### Track A — Software engineering excellence` | module in the `cross-cutting-tracks` group |

Two things are worth knowing about the ids:

- **A roadmap lesson's `id` *is* its roadmap topic id** (`roadmap:phase-4-4.2:0`). The lesson and the
  checkbox on the phase hub are the same entity, so a topic cannot be tracked in two places.
- **Generated modules carry no `description` or `learningObjectives` per lesson.** An unwritten topic
  has no honest description, and inventing one would put words in the roadmap's mouth. Both fields
  are optional in the schema for exactly this reason; authored lessons must still have them.

`estimatedMinutes` on a generated lesson is a flat 45-minute placeholder. Replace it with a real
figure when you write the lesson.

### Writing a lesson for a roadmap topic

The generated module is the outline. To write one of its topics:

1. Find the lesson entry in `content/modules/mastery/NN-<slug>/module.json`.
2. **Keep its `id`.** It is the roadmap topic id and it carries the 3-pass progress.
3. Fill in `description` and `learningObjectives`, fix `estimatedMinutes`, and add
   `"status": "available"` to publish that one lesson.
4. Write `<lesson-slug>.mdx` beside `module.json` to the depth standard at the top of this guide.

Because the generator rewrites `content/modules/mastery/` from scratch on every run, **re-running it
discards hand-written lesson metadata in that track.** Only re-run it when the roadmap document
itself changes, and re-apply authored lesson entries afterwards.

## Add a track

Add an entry to `content/tracks.json` with a unique `slug`, the next unique positive `number`, a `title`, `tagline`, `description`, and `status` (`"available"` once at least one module in it is available, `"planned"` otherwise). Create `content/modules/<track-slug>/` to hold its modules.

## Add a module

Create `content/modules/<track-slug>/NN-module-slug/module.json`. `number` must be unique **within that track** (each track numbers its own modules 1, 2, 3...); `slug` must be unique **across every track**, since lesson routes are still `/learn/[moduleSlug]/[lessonSlug]` with no track segment in the URL. Set `"track"` to the exact track slug — the loader rejects a mismatch between that field and the directory it lives in. Use `"status": "planned"` until every listed lesson has a reviewed MDX file. Planned lesson metadata drives the outline but does not create lesson routes, so a track's full curriculum can be scaffolded and visible long before it's written.

When publishing a module, add every MDX file and assignment, then change the module status to `available`. Builds fail on invalid metadata, duplicate ordering, missing files, or frontmatter mismatches.

## Authoring one sub-topic at a time (current method)

Content is now written **one deep sub-topic at a time**, not one module at a time. Pick the next
unfinished roadmap topic, write that single lesson to the full depth standard above, ship it, then
move to the next.

To make that possible, a lesson may carry its own `"status": "available"` inside a module that is
still `"planned"`:

```json
{ "id": "numpy-the-ndarray-memory-model", "slug": "01-the-ndarray-memory-model", "status": "available", ... }
```

`lib/content/published.ts` → `isLessonPublished()` is the single source of truth: a lesson is
readable when its module is available, **or** when the lesson opts in itself. Routes, the sidebar,
the module page, and lesson pagination all go through it. A module only flips to
`"status": "available"` once every one of its lessons and its assignment are done — the per-lesson
flag publishes work early, it does not lower the bar for calling a module finished.

## The practice layer (`<lesson-slug>.practice.yaml`)

**Since 2026-08-20 this site is a practice system, not a reading site — read `PRACTICE_SYSTEM.md`
before authoring anything.** A topic is not finished when its prose is written. Its `.mdx` teaches;
a sibling `<lesson-slug>.practice.yaml` carries everything the learner *does*:

| Key | What it holds |
|---|---|
| `exercises` | Four tiers (`normal`, `intermediate`, `tricky`, `challenge`) × a `kind` (`write-code`, `predict-output`, `debug`, `refactor`, `code-reading`, `explain`, `design`, `performance`), each with progressive `hints`, a `solution`, and `requiredForMastery` |
| `quizzes` | `checkpoint` quizzes plus exactly one `assessment`; choice questions self-grade, open ones carry a `modelAnswer` the learner marks against |
| `interview` | `shortAnswer` (what you say in the room), `fullAnswer`, `commonWrongAnswer`, `followUps` |
| `projects` | Briefs with milestones, testing requirements, failure cases, revealed `architectureHints`, and a hidden `referenceOutline`; `kind: final-challenge` renders as the topic's closing problem |
| `resources` | Curated free sources, each with `why` it earned its place and what it `covers`. **Check every URL actually resolves before adding it.** |
| `mastery` | Per-topic overrides for the pass mark and which stages are required |

Rules that matter:

- **Debugging and code-reading exercises are `kind`s, not separate sections.** The Debug tab filters
  on them. Do not invent a parallel structure.
- **Every id is a progress key.** Lowercase kebab-case, globally unique, and never renamed once shipped.
- **`lessonId` must be the lesson's own `id`** from `module.json` — for a roadmap lesson that is the
  roadmap topic id, so the lesson, its checkbox and its practice all track as one entity.
- **No hint may be as long as its solution.** `tests/practice.test.ts` enforces that, along with all
  four tiers present, ≥12 exercises, ≥3 debugging, ≥1 code-reading, ≥5 interview questions, an
  assessment, ≥3 resources and a project.
- Prose fields use the small rich-text format in `components/practice/RichText.tsx`: paragraphs,
  `- ` bullets, `` `code` ``, `**bold**`, `[links](url)`. Anything more structured belongs in a
  `code` field or a list field. Use YAML block scalars (`|`) for everything multi-line, and **quote
  any single-line value containing `: `** or the YAML parser will read it as a nested mapping.

The lesson route renders the workbench automatically when a practice file exists, and the plain
prose when it does not — so older Extra Learning lessons are unaffected.

## Add a lesson

Add the lesson summary to `module.json`, then create `lesson-slug.mdx` in the same directory. Its `id`, `module`, order, title, description, minutes, prerequisites, and objectives must agree with the summary. Lesson and exercise IDs are storage keys: never rename a published ID merely to improve wording. Changing one loses the matching saved progress.

Required frontmatter:

```yaml
---
id: stable-lesson-id
title: Sessions and Transactions
description: Control one SQLAlchemy unit of work deliberately.
module: sqlalchemy-core
order: 3
estimatedMinutes: 40
prerequisites: [sa-mapping]
learningObjectives:
  - Explain session scope
  - Distinguish flush from commit
---
```

## Authoring elements

Use fenced code blocks with a language. Add an optional title through the code-fence metadata:

````md
```python title="src/task_api/service.py"
def create_task(title: str) -> Task:
    ...
```
````

Supported course languages include Python, TypeScript, Bash, TOML, SQL, JSON, YAML, and Dockerfile. Highlighting runs on the server.

Use semantic MDX blocks only when they add teaching structure:

```mdx
<TypeScriptComparison>

Explain one useful mental mapping here.

</TypeScriptComparison>

<CommonMistake>

Name the mistake, consequence, and repair.

</CommonMistake>
```

Available blocks are `Callout`, `Concept`, `WhyItMatters`, `TypeScriptComparison`, `CodeExample`, `Exercise`, `Solution`, `Assignment`, `Checkpoint`, `CommonMistake`, `ProductionNote`, `FurtherReading`, `Gotchas`, and `Gotcha`.

For tracks built under the content depth standard above, every lesson needs five exercises — one per difficulty tier — each with a globally stable ID and its answer in a native collapsible solution:

```mdx
<Exercise id="sessions-flush-1" difficulty="easy">

Predict whether the generated primary key is available after `flush()`.

<Solution>

Yes. Flush sends pending SQL inside the open transaction; it does not commit it.

</Solution>
</Exercise>
```

`difficulty` accepts `easy`, `medium`, `hard`, `interview`, or `real-world`. (The legacy Python Backend track omits `difficulty` entirely and keeps three untagged exercises — both forms are valid, `difficulty` is simply how a lesson opts into the newer standard.)

Follow the exercises with a gotchas section — answers stay visible, nothing is hidden behind a reveal:

```mdx
<Gotchas>

<Gotcha question="Does list.sort() return the sorted list?">

No — it sorts in place and returns `None`. Use `sorted()` when you need a new list back.

</Gotcha>

</Gotchas>
```

Each available module ends with `assignment.mdx`, listed in the module's `assignment` field. Include scenario, requirements, suggested structure, acceptance criteria, hints, stretch goals, a hidden reference outline, and the capstone connection. Wrap the working area in `<Assignment id="stable-assignment-id">` so completion is tracked separately. Under the content depth standard, this needs to be a real applied deliverable, not a toy — see the standard above.

## Complete sample lesson

```mdx
---
id: stable-session-lifecycle
title: Session Lifecycle
description: Treat the session as one explicit unit of work.
module: sqlalchemy-core
order: 3
estimatedMinutes: 35
prerequisites: [sa-mapping]
learningObjectives:
  - Explain request-scoped session ownership
  - Distinguish flush and commit
---

## Mental model

A session tracks ORM objects and coordinates one unit of work. It is not a global database client.

<TypeScriptComparison>

A Node query client often executes stateless statements. A SQLAlchemy session also maintains an identity map and pending object state.

</TypeScriptComparison>

## Worked example

```python title="src/task_api/repositories.py"
def add_task(session: Session, task: TaskModel) -> TaskModel:
    session.add(task)
    session.flush()
    return task
```

`flush()` emits SQL but leaves the transaction open. The application transaction boundary decides whether to commit.

<CommonMistake>

Committing inside every repository method prevents a service from making several writes atomic.

</CommonMistake>

<Exercise id="stable-session-lifecycle-1">

Move transaction ownership out of a repository method and into the service boundary.

<Solution>

Let the repository add and flush. Wrap the full service operation in one transaction and commit only after every required write succeeds.

</Solution>
</Exercise>

<Checkpoint>

You can identify who owns the session and who owns the commit.

</Checkpoint>

## Summary

The session is a stateful unit-of-work boundary; repository methods should not fragment a larger transaction.
```

## Navigation and time

Navigation follows module `number`, lesson `order`, then the module assignment. Keep orders unique and do not reuse IDs. Estimate focused reading plus exercises, not passive scanning. Split material that exceeds about 45 minutes when the split creates a coherent boundary.

Before publishing content, run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## The mastery roadmap

`content/roadmap/AI_ML_MASTERY_ROADMAP.md` holds the learner's own AI/ML Mastery Roadmap **verbatim**. It is the curriculum's strategic source of truth and it is not a normal content file:

- **Never paraphrase, compress, reorder, or drop anything in it.** Additions are allowed; deletions are not. Every phase, subsection, checkbox topic, resource blockquote, and Proof Gate is load-bearing.
- **There is no second hand-written copy.** `lib/content/roadmapParser.ts` parses the markdown into the structures both roadmap pages render, so they cannot drift from the document. The roadmap surfaces in two deliberately separate places: `/roadmap/mastery` is the **phase hub** (the working surface — phases, 3-pass topic controls, Proof Gates, linked modules, built on `lib/curriculum/phases.ts`), and `/roadmap/mastery/source` is the **raw verbatim document**. Keep both; the source page is the guarantee that the unmediated text stays readable. `tests/roadmap.test.ts` asserts conservation: the parsed topic list must equal the source's `- [ ]` lines exactly, in order, and every non-empty source line must appear somewhere in the parsed output.
- **Progress IDs are storage keys.** Each checkbox gets `roadmap:<section id>-<subsection number>:<index within that subsection>` and is stored in the existing `completedExercises` array, so roadmap ticks sync through Supabase like any other progress. Appending topics to the end of a subsection is safe; inserting or reordering topics inside one reassigns IDs and loses those ticks.
- **The document is complete** (assembled from three pastes, verified section by section). The truncation machinery is still there and still worth knowing: a `<!-- TRUNCATED HERE -->` marker anywhere in the file flips `Roadmap.complete` to false, the page says so honestly, and the generator refuses to run. If the roadmap is ever extended, never invent the missing tail — paste it verbatim, then delete the marker.

The roadmap describes the *study plan*, and the curriculum is now generated from it, so the two
cannot disagree about what exists. Every generated module carries:

- `roadmapSectionId` — the parsed section it mirrors (`phase-2-2.3`). This is what marks a module as
  being on the roadmap (`isRoadmapModule()`), and it is the key the module page uses to pull that
  section's prose and resource block out of the markdown at request time.
- `roadmapRef` — how the document refers to the section in prose (`"2.3"`, `"Track A"`, `"Phase 0"`).
- `roadmapPhase` / `roadmapGroup` — kept for ordering (`sortByRoadmap()`) and the phase hub.
- `tag` — the section's own `[CORE]` / `[TOOL]` marker.

**Extra Learning modules carry none of those.** What they may carry is `relatedRoadmapSection`: a
cross-reference saying "this material happens to cover roadmap 1.1", shown on the module page and
drawn as a dashed edge on the skill tree. It is a pointer, not membership — the roadmap's own module
for that subsection lives in the phase group.

**Extra Learning is where written-but-off-roadmap material lives.** When the site was rebuilt around
the roadmap, every module with prose on disk moved there and every metadata-only outline the roadmap
already covered was deleted, since the generated modules replace them. Outlines with no roadmap
equivalent (the FastAPI/SQLAlchemy/deployment curriculum, the library tutorials) stayed.

**Build order follows the roadmap's phase order** — see `CLAUDE.md` → "Next up".
