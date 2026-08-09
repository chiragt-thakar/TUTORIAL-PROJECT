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

## Add a track

Add an entry to `content/tracks.json` with a unique `slug`, the next unique positive `number`, a `title`, `tagline`, `description`, and `status` (`"available"` once at least one module in it is available, `"planned"` otherwise). Create `content/modules/<track-slug>/` to hold its modules.

## Add a module

Create `content/modules/<track-slug>/NN-module-slug/module.json`. `number` must be unique **within that track** (each track numbers its own modules 1, 2, 3...); `slug` must be unique **across every track**, since lesson routes are still `/learn/[moduleSlug]/[lessonSlug]` with no track segment in the URL. Set `"track"` to the exact track slug — the loader rejects a mismatch between that field and the directory it lives in. Use `"status": "planned"` until every listed lesson has a reviewed MDX file. Planned lesson metadata drives the outline but does not create lesson routes, so a track's full curriculum can be scaffolded and visible long before it's written.

When publishing a module, add every MDX file and assignment, then change the module status to `available`. Builds fail on invalid metadata, duplicate ordering, missing files, or frontmatter mismatches.

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
