import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import admitted from "../src/data/admitted-families.json" with { type: "json" };

const protocolId = "strict20-human-bibd-v1";
const blockCount = 8;

interface SourceCase {
  candidateId: string;
  condition: string;
  artifact: string;
  mimeType: "image/png" | "video/mp4";
  question: string;
  answerOptions: string[];
  expectedAnswer: string;
  sha256: string;
}

interface SourceManifest {
  id: string;
  cases: SourceCase[];
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function unit(value: string) {
  return Number.parseInt(hash(value).slice(0, 13), 16) / 0x1fffffffffffff;
}

function shuffled<T>(values: readonly T[], key: (value: T) => string) {
  return [...values].sort((left, right) => unit(key(left)) - unit(key(right)));
}

const familyCases = await Promise.all(
  admitted.families.map(async (family) => {
    const manifest = JSON.parse(
      await readFile(resolve(`public/evaluations/${family.planId}/manifest.json`), "utf8"),
    ) as SourceManifest;
    const native = manifest.cases.filter((candidate) => candidate.condition === family.nativeCondition);
    if (native.length !== 16) throw new Error(`${family.planId} must expose exactly 16 native cases`);
    if (new Set(native.map((candidate) => candidate.candidateId)).size !== 16)
      throw new Error(`${family.planId} contains duplicate native cases`);
    return {
      catalogueId: family.catalogueId,
      planId: family.planId,
      modality: family.modality,
      cases: shuffled(native, (candidate) => `${protocolId}:${family.planId}:${candidate.candidateId}`),
    };
  }),
);

const blocks = Array.from({ length: blockCount }, (_, blockIndex) => {
  const selected = familyCases.flatMap((family) =>
    family.cases.slice(blockIndex * 2, blockIndex * 2 + 2).map((candidate) => {
      const answerOptions = shuffled(
        candidate.answerOptions,
        (option) => `${protocolId}:options:${blockIndex}:${candidate.candidateId}:${option}`,
      );
      return {
        studyCaseId: hash(`${protocolId}:${candidate.candidateId}`).slice(0, 20),
        catalogueId: family.catalogueId,
        planId: family.planId,
        candidateId: candidate.candidateId,
        modality: family.modality,
        artifactPath: `/${candidate.artifact.replace(/^public\//, "")}`,
        mediaSha256: candidate.sha256,
        question: candidate.question,
        answerOptions,
      };
    }),
  );
  const cases = shuffled(
    selected,
    (candidate) => `${protocolId}:block:${blockIndex}:${candidate.studyCaseId}`,
  );
  return { blockId: `block-${String(blockIndex + 1).padStart(2, "0")}`, cases };
});

const allStudyCases = blocks.flatMap((block) => block.cases);
if (allStudyCases.length !== 320) throw new Error(`Expected 320 study cases, found ${allStudyCases.length}`);
if (new Set(allStudyCases.map((candidate) => candidate.studyCaseId)).size !== 320)
  throw new Error("Every native case must occur in exactly one block");
for (const block of blocks) {
  if (block.cases.length !== 40) throw new Error(`${block.blockId} must contain 40 cases`);
  const perFamily = new Map<string, number>();
  for (const candidate of block.cases)
    perFamily.set(candidate.catalogueId, (perFamily.get(candidate.catalogueId) ?? 0) + 1);
  if ([...perFamily.values()].some((count) => count !== 2) || perFamily.size !== 20)
    throw new Error(`${block.blockId} must contain two cases from every family`);
}

const output = {
  schemaVersion: 1,
  protocolId,
  generatedFrom: admitted.generatedAt,
  design: {
    blocks: blockCount,
    casesPerBlock: 40,
    casesPerFamilyPerBlock: 2,
    uniqueNativeCases: 320,
    feedback: "none",
    videoPresentation: "one uninterrupted playback at 1x",
    assignment: "one locally persisted block chosen uniformly in the participant browser",
  },
  warning:
    "This is an answer-free participant instrument, not evidence that a human study has been conducted.",
  blocks,
};

const outputPath = resolve("src/data/human-study-manifest.json");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `Wrote ${blocks.length} balanced blocks and ${allStudyCases.length} unique cases to ${outputPath}`,
);
