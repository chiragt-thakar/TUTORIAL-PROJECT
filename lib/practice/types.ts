/**
 * The practice layer.
 *
 * A lesson's `.mdx` file teaches. Everything that makes the learner *do* something —
 * exercises, quizzes, interview drilling, debugging, projects, curated reading — is
 * structured data in a sibling `<lesson-slug>.practice.yaml`, validated by
 * `lib/practice/schema.ts` and loaded by `lib/practice/loader.ts`.
 *
 * Two reasons it is data rather than more MDX:
 *
 * 1. It has to be queried. The practice hub picks a random challenge, surfaces weak topics,
 *    and builds a revision set across every lesson — none of which is possible if a hint is
 *    buried inside compiled JSX.
 * 2. Mastery is computed from it. `lib/practice/mastery.ts` needs to know which exercises are
 *    required, what the pass mark is, and which interview questions matter, per lesson.
 *
 * YAML (not JSON) because every field here is prose or code, and block scalars keep both
 * readable without escaping.
 */

/** How hard, in the sense the learner feels: does the concept apply, or must it be designed? */
export type ExerciseTier = "normal" | "intermediate" | "tricky" | "challenge";

/** What the learner actually does. Drives which practice surface an exercise appears on. */
export type ExerciseKind =
  | "write-code"
  | "predict-output"
  | "debug"
  | "refactor"
  | "code-reading"
  | "explain"
  | "design"
  | "performance";

export interface PracticeExercise {
  id: string;
  tier: ExerciseTier;
  kind: ExerciseKind;
  title: string;
  /** The task, as rich text (see `components/practice/RichText.tsx`). */
  prompt: string;
  /** Starter, broken, or to-be-read code. Highlighted on the server. */
  code?: string;
  /** Progressive: nudge, then stronger clue, then near-reveal. Never fewer than one. */
  hints: string[];
  /** Prose answer, revealed only after the learner asks. */
  solution: string;
  solutionCode?: string;
  /** Why it works, and which Python behaviour is responsible. */
  explanation?: string;
  concepts: string[];
  minutes: number;
  /** Counts toward the practice stage of mastery. */
  requiredForMastery: boolean;
}

export type QuizKind =
  | "mcq"
  | "multi"
  | "true-false"
  | "predict-output"
  | "find-bug"
  | "complete-code"
  | "explain"
  | "write-function"
  | "refactor"
  | "performance"
  | "scenario";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  kind: QuizKind;
  prompt: string;
  code?: string;
  /** Present for `mcq`, `multi` and `true-false`; absent for open questions. */
  options?: QuizOption[];
  /** Option ids that are correct. Empty for open questions, which are self-graded. */
  answer: string[];
  /** The marking key for an open question — what a correct answer must contain. */
  modelAnswer?: string;
  explanation: string;
  concepts: string[];
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  /** A `checkpoint` is a short sub-topic check; the `assessment` is the topic's real exam. */
  kind: "checkpoint" | "assessment";
  /** Percentage needed to pass. The assessment's value feeds mastery. */
  passScore: number;
  questions: QuizQuestion[];
}

export type InterviewLevel =
  | "basic"
  | "intermediate"
  | "advanced"
  | "tricky"
  | "scenario"
  | "debugging"
  | "output"
  | "internals"
  | "comparison";

export interface InterviewQuestion {
  id: string;
  level: InterviewLevel;
  question: string;
  code?: string;
  /** What you actually say in the room, in about thirty seconds. */
  shortAnswer: string;
  /** The full mental model behind the short answer. */
  fullAnswer: string;
  /** The plausible answer that loses the point, and why it is wrong. */
  commonWrongAnswer?: string;
  followUps: string[];
  concepts: string[];
  requiredForMastery: boolean;
}

export interface ProjectMilestone {
  title: string;
  detail: string;
}

export interface ProjectBrief {
  id: string;
  /** `final-challenge` is the topic's closing problem; the rest are build work. */
  kind: "micro" | "small" | "major" | "final-challenge";
  title: string;
  summary: string;
  problem: string;
  requirements: string[];
  constraints: string[];
  expectedBehaviour: string[];
  /** A directory tree, shown as a code block. Omit for anything single-file. */
  structure?: string;
  milestones: ProjectMilestone[];
  testing: string[];
  failureCases: string[];
  bonus: string[];
  /** Architecture guidance, revealed on request — not the implementation. */
  architectureHints: string[];
  /** The shape of a good solution, hidden hardest of all. Still not a copy-paste answer. */
  referenceOutline?: string;
  minutes: number;
}

export type ResourceType =
  | "docs"
  | "tutorial"
  | "university"
  | "article"
  | "interactive"
  | "video"
  | "repo"
  | "book"
  | "talk";

export interface Resource {
  name: string;
  type: ResourceType;
  difficulty: "intro" | "core" | "deep";
  url: string;
  /** Why this one earned its place over the obvious alternatives. */
  why: string;
  /** Which part of the topic it covers. */
  covers: string;
  /** 1-5. Anything below 3 should not be here at all. */
  usefulness: number;
}

/** Configurable per lesson — see `lib/practice/mastery.ts` for the defaults. */
export interface MasteryRules {
  minAssessmentScore: number;
  requireProject: boolean;
  requireInterview: boolean;
  requireDebug: boolean;
  /** Days after which a mastered topic resurfaces for revision. */
  revisitAfterDays: number;
}

export interface PracticeSet {
  /** Matches the lesson's `id` in `module.json` — the same key progress is stored against. */
  lessonId: string;
  module: string;
  lesson: string;
  title: string;
  summary: string;
  exercises: PracticeExercise[];
  quizzes: Quiz[];
  interview: InterviewQuestion[];
  projects: ProjectBrief[];
  resources: Resource[];
  mastery: MasteryRules;
}

/**
 * The minimum a value must have for mastery and selection to work on it.
 *
 * Structural rather than a union of concrete set types, so the practice hub can ship a stripped
 * index — ids, tiers and rules, none of the prose, hints or highlighted HTML — instead of every
 * solution on the site being embedded in a static page the learner has not earned yet.
 */
export interface MasteryShape {
  lessonId: string;
  mastery: MasteryRules;
  exercises: ReadonlyArray<Pick<PracticeExercise, "id" | "kind" | "tier" | "title" | "requiredForMastery">>;
  quizzes: ReadonlyArray<Pick<Quiz, "id" | "kind" | "passScore">>;
  interview: ReadonlyArray<Pick<InterviewQuestion, "id" | "requiredForMastery">>;
  projects: ReadonlyArray<Pick<ProjectBrief, "id" | "kind">>;
}

/** What the practice hub loads for every topic: enough to rank and route, nothing more. */
export interface PracticeIndexEntry extends MasteryShape {
  module: string;
  lesson: string;
  title: string;
  summary: string;
  exercises: Array<Pick<PracticeExercise, "id" | "kind" | "tier" | "title" | "minutes" | "requiredForMastery">>;
  quizzes: Array<Pick<Quiz, "id" | "kind" | "passScore" | "title">>;
  interview: Array<Pick<InterviewQuestion, "id" | "level" | "requiredForMastery">>;
  projects: Array<Pick<ProjectBrief, "id" | "kind" | "title">>;
}

/** A code block after server-side highlighting: raw text for copying, HTML for display. */
export interface RenderedCode {
  code: string;
  html: string;
  language: string;
}

type WithRenderedCode<T> = Omit<T, "code"> & { code?: RenderedCode };

export type RenderedExercise = Omit<PracticeExercise, "code" | "solutionCode"> & {
  code?: RenderedCode;
  solutionCode?: RenderedCode;
};
export type RenderedQuizQuestion = WithRenderedCode<QuizQuestion>;
export type RenderedQuiz = Omit<Quiz, "questions"> & { questions: RenderedQuizQuestion[] };
export type RenderedInterviewQuestion = WithRenderedCode<InterviewQuestion>;
export type RenderedProject = Omit<ProjectBrief, "structure"> & { structure?: RenderedCode };

export interface RenderedPracticeSet extends Omit<PracticeSet, "exercises" | "quizzes" | "interview" | "projects"> {
  exercises: RenderedExercise[];
  quizzes: RenderedQuiz[];
  interview: RenderedInterviewQuestion[];
  projects: RenderedProject[];
}
