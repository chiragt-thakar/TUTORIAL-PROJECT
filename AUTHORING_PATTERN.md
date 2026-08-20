# AUTHORING_PATTERN.md — the reusable content pattern

**Purpose of this file:** it is a *self-contained* specification of how one topic is authored on
this site, written so it can be pasted into any model (Claude, ChatGPT, anything) with no other
repo context and still produce a file pair that drops straight into the project and passes the
test suite. Nothing here is aspirational — every rule below is either enforced by a test or was
followed by the topics already shipped.

Companions: `CLAUDE.md` (project state), `PRACTICE_SYSTEM.md` (the brief and progress log),
`CONTENT_GUIDE.md` (authoring contract). If those disagree with this file, they win on *policy*;
this file wins on *shape*.

---

## 0. The one-paragraph version

Every roadmap topic becomes **two files**, side by side in the module directory, sharing a slug:

```text
content/modules/mastery/<NN>-<module-slug>/
  <NN>-<lesson-slug>.mdx            # LEARN  — the teaching prose
  <NN>-<lesson-slug>.practice.yaml  # PRACTICE / DEBUG / INTERVIEW / TEST / PROJECT / REVIEW
  module.json                       # the lesson entry is edited in place
```

The site renders those as seven tabs on one lesson page:
`Learn · Practice · Debug · Interview · Test · Project · Review`.
The `.mdx` is Learn. **Everything else comes out of the one YAML file** — Debug is the
`kind: debug` exercises, Test is the `quizzes`, and so on. There is no third file.

---

## 1. The six-mode mapping (what feeds what)

| Tab | Source | Rule |
|---|---|---|
| **Learn** | `<slug>.mdx` | Deep teaching prose + inline `<Exercise>`/`<Solution>` + `<Gotchas>` |
| **Practice** | `exercises[]` where `kind != debug` | Progressive hints, never an instant solution |
| **Debug** | `exercises[]` where `kind: debug` | **3 or more required.** Broken code the learner must fix |
| **Interview** | `interview[]` | **5 or more required.** short + full + wrong answer + follow-ups |
| **Test** | `quizzes[]` | One `kind: checkpoint` (short) + one `kind: assessment` (~10 Q, scored) |
| **Project** | `projects[]` | At least 1. Usually a `major` project **and** a `final-challenge` |
| **Review** | derived | Spaced repetition off `revisitAfterDays`; nothing to author |

Plus `resources[]` (3 or more curated, verified, justified) rendered under Learn.

---

## 2. Step 1 — the `module.json` lesson entry

Find the lesson object by its `id` (which is the roadmap topic id — **never change it**) and
replace the generated placeholder fields:

```jsonc
{
  "id": "roadmap:phase-1-1.1:3",            // KEEP AS-IS. progress key + roadmap topic id.
  "slug": "04-context-managers-and-contextlib",
  "title": "Context managers and contextlib",   // roadmap's exact wording. KEEP AS-IS.
  "order": 4,
  "estimatedMinutes": 95,                    // honest number, replaces the flat 45 placeholder
  "prerequisites": ["roadmap:phase-1-1.1:0"],
  "learningObjectives": [                    // 4 real ones, replacing the three "Pass 1/2/3" stubs
    "Verb-first, testable, specific to this topic"
  ],
  "description": "One or two sentences saying what the topic actually is.",
  "status": "available"                      // this line is what publishes the lesson
}
```

Leave the **module's** own `"status": "planned"` alone. A module only flips to `available` when
every one of its lessons is written. The per-lesson `status` publishes early.

---

## 3. Step 2 — `<slug>.mdx` (the Learn tab)

### 3.1 Frontmatter (exact fields, validated by Zod)

```yaml
---
id: "roadmap:phase-1-1.1:3"          # must equal module.json's lesson id
title: "Context managers and contextlib"
description: One sentence. Same as module.json's description.
module: 1-1-python-fluency-beyond-the-basics   # the module SLUG, no NN prefix
order: 4
estimatedMinutes: 95
prerequisites: ["roadmap:phase-1-1.1:0"]
learningObjectives:
  - four of them, matching module.json
---
```

### 3.2 Available MDX components (these and only these)

`<Callout>` `<Concept>` `<WhyItMatters>` `<TypeScriptComparison>` `<CommonMistake>`
`<ProductionNote>` `<Checkpoint>` `<FurtherReading>` `<CodeExample title="...">`
`<Exercise id="..." difficulty="...">` `<Solution>` `<Gotchas>` `<Gotcha question="...">`

Fenced code blocks are Shiki-highlighted at build time; use ` ```python `.
Every block component needs **blank lines around its children** or MDX will not parse the markdown
inside it.

### 3.3 Required structure, in order

1. **Opening (2–4 short paragraphs).** State the mental model in the first three sentences. No
   "In this lesson we will...". Open with the claim that reframes the topic.
2. **`<TypeScriptComparison>`** — 3–5 bullets contrasting with JS/TS. Only where it *illuminates*;
   say plainly where the languages agree.
3. **The body**, `##` sections progressing **basic → practical → advanced → edge case**. Cover:
   what it is · why it exists · the problem it solves · how it works internally · syntax and rules ·
   real-world usage · performance · mistakes · edge cases · best practice.
4. **Grounding in what the learner is heading toward** — PyTorch, FastAPI, SQLAlchemy, Pydantic,
   LLM serving. Not toy examples.
5. **Five `<Exercise>` blocks**, one of each `difficulty`, in this order:
   `easy` → `medium` → `hard` → `interview` → `real-world`. Each has a `<Solution>` that *teaches*,
   not just answers. The `interview` one is answered "as you would in the room".
6. **`## Checkpoint`** — 5 questions to answer without looking back. Plain markdown heading.
7. **`## Gotchas`** followed by `<Gotchas>` containing **6–8** `<Gotcha question="...">` blocks.
   Question phrased as the learner would ask it while stuck ("Why does my ... ?").
8. **`## Summary`** — 3–4 paragraphs. The last one points at the Practice/Debug/Project tabs.

### 3.4 Hard limits enforced by `tests/content.test.ts`

- All five `difficulty=` tiers present, verbatim strings.
- `<Gotchas>` present with at least one `<Gotcha question=`.
- At least 3 `<Exercise id=`, and `<Solution>` count >= exercise count.
- A `## Checkpoint` and a `## Summary` heading.
- At least 250 words, at least one fenced code block.
- **No prose paragraph over 70 words.** This one bites constantly — break paragraphs at 3–4
  sentences.

### 3.5 Voice

Senior engineer explaining to a smart junior who already ships Node/TypeScript/Postgres/Redis/Kafka
in production. Precise, opinionated, grounded in what actually breaks. Never encyclopedic, never
marketing, no emoji, no "Let's dive in". Prefer the sentence that changes how they read the next
code block.

---

## 4. Step 3 — `<slug>.practice.yaml` (the other six tabs)

### 4.1 Full schema

```yaml
lessonId: "roadmap:phase-1-1.1:3"     # == module.json lesson id
module: 1-1-python-fluency-beyond-the-basics
lesson: 04-context-managers-and-contextlib   # the file slug, no extension
title: "Context managers and contextlib"
summary: One sentence.

mastery:
  minAssessmentScore: 80    # 1-100
  requireProject: true
  requireInterview: true
  requireDebug: true
  revisitAfterDays: 21

exercises:
  - id: cm-something            # lowercase kebab, GLOBALLY unique across the site, forever
    tier: normal                # normal | intermediate | tricky | challenge
    kind: write-code            # write-code | predict-output | debug | refactor
                                # | code-reading | explain | design | performance
    title: Imperative, specific
    minutes: 10
    requiredForMastery: true    # default false
    concepts: ["one", "two"]    # at least one, used by the weak-topic selector
    prompt: |
      Multi-line. Markdown allowed. Fenced code allowed.
    code: |                     # optional — starting/broken code. REQUIRED for kind: debug
      ...
    hints:                      # 1-4, PROGRESSIVE: nudge, then mechanism, then nearly there
      - Shorter than the solution. (A test enforces this.)
      - Second hint names the tool without using it.
    solution: |
      Prose explanation of the reasoning.
    solutionCode: |             # optional
      ...
    explanation: |              # optional — the "why this matters beyond the exercise" note
      ...

quizzes:
  - id: cm-checkpoint
    title: Checkpoint — sub-theme
    kind: checkpoint            # checkpoint | assessment
    passScore: 75
    questions:
      - id: cm-cp-one
        kind: mcq               # mcq | multi | true-false | predict-output | find-bug
                                # | complete-code | explain | write-function | refactor
                                # | performance | scenario
        prompt: ...
        code: |                 # optional
        options:                # 2 or more for choice questions; omit entirely for open ones
          - id: a
            text: ...
          - id: b
            text: ...
        answer: ["a"]           # exactly ONE for mcq; several for multi
        modelAnswer: |          # REQUIRED instead of options/answer for open questions
        explanation: |          # always required — shown after answering
        concepts: ["..."]
        points: 1

interview:
  - id: cm-iv-basics
    level: basic                # basic | intermediate | advanced | tricky | scenario
                                # | debugging | output | internals | comparison
    requiredForMastery: true
    concepts: ["..."]
    question: ...
    code: |                     # optional
    shortAnswer: |              # what you actually say out loud, 3-5 sentences
    fullAnswer: |               # the full mental model, 2-4 paragraphs
    commonWrongAnswer: |        # the plausible answer that is subtly wrong, and why
    followUps:
      - The question a good interviewer asks next

projects:
  - id: cm-project-name
    kind: major                 # micro | small | major | final-challenge
    title: ...
    minutes: 180
    summary: One sentence.
    problem: |
      ...
    requirements: []            # at least one, each a testable sentence
    constraints: []
    expectedBehaviour: []
    structure: |                # optional file tree
      ...
    milestones:
      - title: "1 — ..."
        detail: ...
    testing: []
    failureCases: []            # the wrong turns people actually take
    bonus: []
    architectureHints: []       # revealed on request, not by default
    referenceOutline: |         # hidden hardest of all — the answer key
      ...

resources:
  - name: ...
    type: docs                  # docs|tutorial|university|article|interactive|video|repo|book|talk
    difficulty: core            # intro | core | deep
    url: "https://..."          # https only; verify it returns 200 before shipping
    usefulness: 5               # 3-5. Below 3 means don't include it.
    why: ...                    # 6+ words, a real reason, not a description
    covers: ...                 # exactly what you get from it
```

### 4.2 Hard limits enforced by `tests/practice.test.ts`

- All four `tier` values present at least once.
- **12 or more exercises** total.
- **3 or more exercises with `kind: debug`**, **1 or more with `kind: code-reading`**.
- Every exercise has **2 or more hints**, and **no hint may be as long as its own `solution`**.
- **5+ interview questions**; **3+ resources**; **1+ project**; **1+ assessment quiz**.
- Every `id` unique **site-wide** (they are progress keys — renaming one destroys progress).
- The lesson must exist with `"status": "available"` and an `.mdx` beside it.

### 4.3 Target volume (what the shipped topics actually did)

**22–25 exercises**, distributed roughly:

| Tier | Count | Kind | Count |
|---|---|---|---|
| normal | 7 | write-code | 6–9 |
| intermediate | 8–9 | predict-output | 4–6 |
| tricky | 6–7 | debug | 4–5 |
| challenge | 2 | code-reading | 2 |
| | | design | 2–3 |
| | | explain / refactor / performance | 1 each |

Tier and kind are **independent axes** — a debug exercise still sits in a tier.

Plus: **1 checkpoint (4 Q)** · **1 assessment (10 Q)** mixing at least six question kinds ·
**8 interview questions** spanning most `level` values · **1 major project (~180 min)** ·
**1 final-challenge (~60 min)** · **5 resources**.

---

## 5. Quality rules that no test can enforce (the important ones)

1. **Never show the solution first.** The flow is
   `question → attempt → hint 1 → hint 2 → hint 3 → solution → explanation`.
   A hint that gives the mechanism away in hint 1 is a bug.
2. **Difficulty comes from understanding, never from wording.** No trick phrasing, no ambiguity.
   A tricky exercise is tricky because the *language* is subtle, not because the prompt is.
3. **No two exercises may differ only in variable names.** If you cannot state what a new exercise
   teaches that an existing one does not, delete it.
4. **Projects must be real developer problems.** No calculators, no todo lists, no
   student-management CRUD. The shipped projects were: descriptor/slots machinery behind an
   ORM · a streaming pipeline with a proven memory ceiling · a six-decorator production toolkit.
   Standard library only wherever possible.
5. **The final-challenge pattern that works:** one realistic module containing **exactly N defects**
   (8–10), at least two of which are **silent** — wrong behaviour, no exception. Require a written
   defect list *before* any code change, and a regression test per defect that must be verified to
   fail against the original.
6. **Resources are curated, not collected.** 5 excellent free primary sources (PEPs, CPython docs,
   the language reference). Every URL fetched and confirmed 200 at authoring time. `why` must say
   something the title does not.
7. **Ground everything in the ML/AI destination.** PyTorch, tokenizers, training loops, inference
   servers, RAG pipelines — that is where this learner is going.
8. **Compare to JS/TS only where it illuminates.** Where the languages agree, say so in one line
   and move on.

---

## 6. Definition of done for one topic

- [ ] `module.json` lesson entry: `description`, real `learningObjectives`, honest
      `estimatedMinutes`, `"status": "available"`. `id` and `title` untouched.
- [ ] `<slug>.mdx` written to section 3.
- [ ] `<slug>.practice.yaml` written to section 4.
- [ ] Every resource URL verified to return 200.
- [ ] All four commands green:

      npm.cmd run lint
      npm.cmd run typecheck
      npm.cmd test
      npm.cmd run build

- [ ] `PRACTICE_SYSTEM.md` "Progress log" appended with an entry recording the exercise/hint counts
      and the tier/kind breakdown.
- [ ] `CLAUDE.md` "Next up" and the status table updated.

---

## 7. Prompt to hand another model

> You are authoring one topic for a practice-first Python to AI/ML learning site. Read
> `AUTHORING_PATTERN.md` in full and follow it exactly. The topic is **`<topic title>`**, lesson id
> `<roadmap:...>`, slug `<NN-slug>`, in module `<module-slug>` at
> `content/modules/mastery/<NN>-<module-slug>/`. Produce three things: (1) the updated `module.json`
> lesson entry, (2) the complete `<slug>.mdx`, (3) the complete `<slug>.practice.yaml`. Match the
> depth, voice and volume of the topics already shipped in that directory — read the highest-numbered
> existing `.mdx` and its `.practice.yaml` as the reference implementation. Do not lower any number
> in section 4.2 or 4.3. Do not paraphrase the roadmap's topic title. Do not invent MDX components
> beyond the list in section 3.2.

The reference pair to imitate is always the **most recently shipped topic** in the module — it is
the highest-water mark.
