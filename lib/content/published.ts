import type { LessonSummary, Module } from "@/types/curriculum";

/**
 * A lesson is readable when its module is available, or when the lesson itself opts in with
 * `"status": "available"`. The opt-in is what lets a single finished lesson ship inside a
 * module that is still being written, one deep sub-topic at a time.
 *
 * Lives apart from `loader.ts` so client components can import it without pulling in `server-only`.
 */
export function isLessonPublished(courseModule: Module, lesson: LessonSummary): boolean {
  return lesson.status === "available" || (courseModule.status === "available" && lesson.status !== "planned");
}
