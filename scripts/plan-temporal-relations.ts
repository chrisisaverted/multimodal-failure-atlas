import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createTemporalRelationGrid, temporalRelationsVersion, temporalRelationTasks } from "../src/lib/discovery/temporal-relations";
for (const task of temporalRelationTasks) {
  const output = resolve(`evaluation/discovery/${task}-discovery-v1.json`); const candidates = createTemporalRelationGrid(task);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify({ id: `${task}-discovery-v1`, generatorVersion: temporalRelationsVersion, status: "discovery-only", hypothesis: task === "duration-comparison" ? "Video models fail direct duration comparison across visible intervals." : "Video models fail fine temporal alignment despite repeated redundant flashes.", candidates }, null, 2)}\n`);
  console.log({ output, candidates: candidates.length });
}
