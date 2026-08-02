# Content guide

The site treats curriculum metadata and lesson prose as two layers: `module.json` controls ordering and availability; `.mdx` files contain long-form teaching. All IDs are persisted in learner progress, so stability matters.

## Add a module

Create `content/modules/NN-module-slug/module.json`. Use the next unique positive `number`, a stable kebab-case `slug`, prerequisites, outcomes, duration, and ordered lesson summaries. Use `"status": "planned"` until every listed lesson has a reviewed MDX file. Planned lesson metadata drives the outline but does not create lesson routes.

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

Available blocks are `Callout`, `Concept`, `WhyItMatters`, `TypeScriptComparison`, `CodeExample`, `Exercise`, `Solution`, `Assignment`, `Checkpoint`, `CommonMistake`, `ProductionNote`, and `FurtherReading`.

Every normal lesson should normally contain three to five exercises that progress from prediction to implementation or bug repair. Give each exercise a globally stable ID and place its answer in a native collapsible solution:

```mdx
<Exercise id="sessions-flush-1">

Predict whether the generated primary key is available after `flush()`.

<Solution>

Yes. Flush sends pending SQL inside the open transaction; it does not commit it.

</Solution>
</Exercise>
```

Each available module ends with `assignment.mdx`, listed in the module's `assignment` field. Include scenario, requirements, suggested structure, acceptance criteria, hints, stretch goals, a hidden reference outline, and the capstone connection. Wrap the working area in `<Assignment id="stable-assignment-id">` so completion is tracked separately.

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
