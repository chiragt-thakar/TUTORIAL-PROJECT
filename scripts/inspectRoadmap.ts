import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseRoadmap } from "../lib/content/roadmapParser";

const file = path.join(process.cwd(), "content", "roadmap", "AI_ML_MASTERY_ROADMAP.md");
const roadmap = parseRoadmap(await readFile(file, "utf8"));

console.log("topicCount", roadmap.topicCount, "complete", roadmap.complete);
for (const phase of roadmap.phases) {
  console.log(`\n== PHASE ${phase.number} [${phase.tag}] — ${phase.duration} — ${phase.title}  id=${phase.id} topics=${phase.topicCount}`);
  console.log(`   intro blocks: ${phase.intro.map((b) => `${b.kind}(${b.items?.length ?? b.lines.length})`).join(" ")}`);
  for (const g of phase.groups) {
    console.log(`   -- ${g.id} | num=${g.number} | ${g.title} | topics=${g.topicCount}`);
    console.log(`      blocks: ${g.blocks.map((b) => `${b.kind}(${b.items?.length ?? b.lines.length})`).join(" ")}`);
  }
  console.log(`   proofGate: ${phase.proofGate ? phase.proofGate.map((b)=>b.kind).join(",") : "none"}`);
}
for (const s of roadmap.appendixSections) {
  console.log(`\n== APPENDIX ${s.id} — ${s.title} topics=${s.topicCount}`);
  for (const g of s.groups) console.log(`   -- ${g.id} | num=${g.number} | ${g.title} | topics=${g.topicCount} | blocks: ${g.blocks.map((b) => `${b.kind}(${b.items?.length ?? b.lines.length})`).join(" ")}`);
}
for (const s of roadmap.frontSections) console.log(`\n== FRONT ${s.id} — ${s.title} topics=${s.topicCount}`);
