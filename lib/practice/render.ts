import "server-only";

import { codeToHtml } from "shiki";
import type {
  PracticeSet,
  RenderedCode,
  RenderedExercise,
  RenderedInterviewQuestion,
  RenderedPracticeSet,
  RenderedProject,
  RenderedQuiz,
} from "./types";

/**
 * Highlights every code field in a practice set at build time.
 *
 * The practice surfaces are client components — they own hint reveals, quiz state and timers — so
 * they cannot run Shiki themselves without shipping a highlighter to the browser. Instead the code
 * is highlighted here, during the static export, and the client receives ready HTML plus the raw
 * text for the copy button.
 *
 * `defaultColor: false` emits the `--shiki-light` / `--shiki-dark` custom properties that
 * `app/globals.css` already uses for MDX code blocks, so both themes work from one render and
 * practice code looks identical to lesson code.
 */

const THEMES = { light: "github-light", dark: "github-dark" } as const;

async function highlight(code: string, language = "python"): Promise<RenderedCode> {
  const trimmed = code.replace(/\s+$/, "");
  const html = await codeToHtml(trimmed, { lang: language, themes: THEMES, defaultColor: false });
  return { code: trimmed, html, language };
}

async function maybe(code: string | undefined, language?: string): Promise<RenderedCode | undefined> {
  return code === undefined ? undefined : highlight(code, language);
}

export async function renderPracticeSet(set: PracticeSet): Promise<RenderedPracticeSet> {
  const exercises: RenderedExercise[] = await Promise.all(
    set.exercises.map(async (exercise) => ({
      ...exercise,
      code: await maybe(exercise.code),
      solutionCode: await maybe(exercise.solutionCode),
    })),
  );

  const quizzes: RenderedQuiz[] = await Promise.all(
    set.quizzes.map(async (quiz) => ({
      ...quiz,
      questions: await Promise.all(quiz.questions.map(async (question) => ({ ...question, code: await maybe(question.code) }))),
    })),
  );

  const interview: RenderedInterviewQuestion[] = await Promise.all(
    set.interview.map(async (question) => ({ ...question, code: await maybe(question.code) })),
  );

  const projects: RenderedProject[] = await Promise.all(
    // A folder tree is not Python; highlighting it as such invents keywords that are not there.
    set.projects.map(async (project) => ({ ...project, structure: await maybe(project.structure, "text") })),
  );

  return { ...set, exercises, quizzes, interview, projects };
}
