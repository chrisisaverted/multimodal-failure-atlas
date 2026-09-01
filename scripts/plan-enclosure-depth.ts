import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createEnclosureDepthDiscoveryGrid,
  enclosureDepthVersion,
} from "../src/lib/discovery/enclosure-depth";

const output = resolve("evaluation/discovery/enclosure-depth-discovery-v1.json");
const candidates = createEnclosureDepthDiscoveryGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "enclosure-depth-discovery-v1",
      generatorVersion: enclosureDepthVersion,
      status: "discovery-only",
      hypothesis:
        "Vision-language models approximate contour numerosity without reliably distinguishing topologically closed enclosing loops from open fragments.",
      candidates,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: candidates.length });
