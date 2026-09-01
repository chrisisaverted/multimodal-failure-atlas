import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  changeLocalizationVersion,
  createChangeLocalizationDiscoveryGrid,
} from "../src/lib/discovery/change-localization";

const output = resolve("evaluation/discovery/change-localization-discovery-v1.json");
const candidates = createChangeLocalizationDiscoveryGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "change-localization-discovery-v1",
      generatorVersion: changeLocalizationVersion,
      status: "discovery-only",
      hypothesis:
        "Global visual token compression prevents exhaustive cross-image comparison of many locally similar glyphs.",
      candidates,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: candidates.length });
