import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createSelectiveFlashDiscoveryGrid,
  selectiveFlashVersion,
} from "../src/lib/discovery/selective-flash-tracking";

const output = resolve("evaluation/discovery/selective-flash-discovery-v1.json");
const candidates = createSelectiveFlashDiscoveryGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "selective-flash-discovery-v1",
      generatorVersion: selectiveFlashVersion,
      status: "discovery-only",
      hypothesis:
        "Video routes lose exact event counts when temporal accumulation must stay conditioned on one moving visual identity amid asynchronous distractors.",
      candidates,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: candidates.length });
