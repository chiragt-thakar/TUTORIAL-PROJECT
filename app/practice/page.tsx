import type { Metadata } from "next";
import { getPracticeIndex } from "@/lib/practice/loader";
import { PracticeHub } from "@/components/practice/PracticeHub";

export const metadata: Metadata = {
  title: "Practice",
  description: "Today's challenge, topics due for revision, weak areas, and mastery across every topic.",
};

export default async function PracticePage() {
  const index = await getPracticeIndex();

  return (
    <div className="standard-page">
      <header className="page-header">
        <p className="eyebrow">PRACTICE</p>
        <h1>The gym</h1>
        <p>
          Everything here is work, not reading. Pick the challenge, clear the revision queue, or go straight at whatever
          you are worst at — each card drops you into the topic&rsquo;s own workbench at the right mode.
        </p>
      </header>
      <PracticeHub index={index} />
    </div>
  );
}
