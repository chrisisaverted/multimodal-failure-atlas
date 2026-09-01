import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  changeLocalizationVersion,
  createChangeLocalizationHardGrid,
} from "../src/lib/discovery/change-localization";

const output = resolve("evaluation/discovery/change-localization-discovery-v2.json");
const candidates = createChangeLocalizationHardGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "change-localization-discovery-v2",
      generatorVersion: changeLocalizationVersion,
      status: "discovery-only",
      supersedes: "change-localization-discovery-v1 cell gridSize=28, which Gemini solved 4/8",
      hypothesis:
        "A 34×34 exact comparison crosses the visual exhaustive-search boundary while remaining inspectable at native resolution.",
      candidates,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: candidates.length });
