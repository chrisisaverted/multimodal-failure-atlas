import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createRotationCorrespondenceDiscoveryGrid,
  rotationCorrespondenceVersion,
} from "../src/lib/discovery/rotation-correspondence";

const output = resolve("evaluation/discovery/rotation-correspondence-discovery-v1.json");
const candidates = createRotationCorrespondenceDiscoveryGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "rotation-correspondence-discovery-v1",
      generatorVersion: rotationCorrespondenceVersion,
      status: "discovery-only",
      hypothesis:
        "Compressed visual representations lose exact vertex-level correspondence under rotation and reflection distractors.",
      candidates,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: candidates.length });
