// Sanity checks for the prompt library: every line parses and every challenge
// gets a complete brief. Run with `npm test` before pushing changes.
const fs = require("fs");
const path = require("path");
const { parse } = require("../docs/lib/prompts");
const { buildBrief } = require("../docs/lib/brief");

const file = path.join(__dirname, "..", "docs", "600_design_practice_prompts.txt");
const text = fs.readFileSync(file, "utf8");
const numbered = text.split(/\r?\n/).filter((line) => /^\d+\.\s/.test(line.trim()));
const challenges = parse(text);
const problems = [];

if (challenges.length !== numbered.length) {
  problems.push(`Parsed ${challenges.length} of ${numbered.length} numbered lines — check the format of new lines.`);
}

const ids = new Set();
for (const c of challenges) {
  if (ids.has(c.id)) problems.push(`#${c.id}: duplicate number`);
  ids.add(c.id);
  const brief = buildBrief(c);
  const missing = [];
  if (brief.think.length < 3) missing.push("task questions (TASKS)");
  if (!brief.avoid) missing.push("trap (TASKS)");
  if (!brief.realContent) missing.push(`domain "${c.domain}" (DOMAINS)`);
  if (brief.checklist.length < 3) missing.push("constraint checks (CONSTRAINTS)");
  if (missing.length) problems.push(`#${c.id}: missing ${missing.join(", ")} in docs/lib/brief.js`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log(`OK: ${challenges.length} challenges, all with complete briefs.`);
