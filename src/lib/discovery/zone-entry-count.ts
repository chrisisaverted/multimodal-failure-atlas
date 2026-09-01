import { z } from "zod";
import { sha256 } from "../evaluation/hash";
export const zoneEntryVersion = "identity-conditioned-zone-entry-count-v1";
export const zoneEntryAnswers = ["8", "10", "12", "14"] as const;
export const zoneEntryCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("identity-conditioned-spatial-transition-counting"),
  question: z.string(),
  answerOptions: z.array(z.enum(zoneEntryAnswers)).length(4),
  expectedAnswer: z.enum(zoneEntryAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    cycles: z.number().int().min(4).max(7),
    entryCount: z.number().int().min(8).max(14),
    activeStartMs: z.literal(900),
    activeEndMs: z.literal(11400),
    videoDurationMs: z.literal(12800),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type ZoneEntryCandidate = z.infer<typeof zoneEntryCandidateSchema>;
function rng(seed: number) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000;
}
function shuffled<T>(values: readonly T[], random: () => number) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
export function createZoneEntryCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  cycles: number;
  visualVariant?: number;
}) {
  const entryCount = input.cycles * 2,
    visualVariant = input.visualVariant ?? input.seed % 263;
  return zoneEntryCandidateSchema.parse({
    id: `ze-${sha256(JSON.stringify({ ...input, visualVariant })).slice(0, 16)}`,
    cellId: "cell-ringed-target-central-zone-entries",
    split: input.split,
    seed: input.seed,
    failureModeId: "identity-conditioned-spatial-transition-counting",
    question:
      "How many times does the RED-RINGED target disk ENTER the gold zone? Count each outside→inside transition and ignore every other disk.",
    answerOptions: shuffled(zoneEntryAnswers, rng(input.seed + 67)),
    expectedAnswer: String(entryCount),
    humanSolvability: "unverified",
    parameters: {
      cycles: input.cycles,
      entryCount,
      activeStartMs: 900,
      activeEndMs: 11400,
      videoDurationMs: 12800,
      fps: 30,
      visualVariant,
    },
  });
}
export function createZoneEntryGrid() {
  const out: ZoneEntryCandidate[] = [];
  let seed = 4_300_000;
  for (let rep = 0; rep < 2; rep++)
    for (let cycles = 4; cycles <= 7; cycles++)
      out.push(
        createZoneEntryCandidate({
          split: "discovery",
          seed: seed++,
          cycles,
          visualVariant: rep * 4 + cycles - 4,
        }),
      );
  return out;
}
export function createZoneEntryHoldout() {
  const out: ZoneEntryCandidate[] = [];
  let seed = 4_310_000;
  for (let rep = 0; rep < 4; rep++)
    for (let cycles = 4; cycles <= 7; cycles++)
      out.push(
        createZoneEntryCandidate({
          split: "confirmatory",
          seed: seed++,
          cycles,
          visualVariant: 100 + rep * 4 + cycles - 4,
        }),
      );
  return out;
}
export function renderZoneEntrySvg(candidate: ZoneEntryCandidate, timestampMs: number, control = false) {
  const u = Math.max(
      0,
      Math.min(
        1,
        (timestampMs - candidate.parameters.activeStartMs) /
          (candidate.parameters.activeEndMs - candidate.parameters.activeStartMs),
      ),
    ),
    x = 360 + 270 * Math.cos(Math.PI * 2 * candidate.parameters.cycles * u),
    y = 350,
    inZone = x >= 300 && x <= 420,
    random = rng(candidate.seed + 19),
    distractors = Array.from({ length: 4 }, (_, i) => {
      const phase = random() * Math.PI * 2,
        dx = 360 + 270 * Math.sin(phase + timestampMs / (1500 + i * 170)),
        dy = 220 + i * 85 + 42 * Math.sin(phase * 2 + timestampMs / 900);
      return `<circle cx="${dx}" cy="${dy}" r="25" fill="${inZone && i === 0 ? "#777" : ["#2466cc", "#1d9b5f", "#9146c7", "#df3c30"][i]}" stroke="#202322" stroke-width="4"/>`;
    }).join(""),
    completed =
      timestampMs <= candidate.parameters.activeStartMs
        ? 0
        : timestampMs >= candidate.parameters.activeEndMs
          ? candidate.parameters.entryCount
          : Math.floor(u * candidate.parameters.entryCount + 0.001),
    status =
      timestampMs < 900 ? "GET READY" : timestampMs < 11400 ? "COUNT TARGET ENTRIES" : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="680"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="47" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700">COUNT TARGET ZONE ENTRIES</text><text x="360" y="82" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">Count outside → inside transitions of the red-ringed disk only</text><text x="360" y="125" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${status}</text><rect x="55" y="155" width="610" height="430" rx="24" fill="#fffef9" stroke="#202322" stroke-width="5"/><rect x="300" y="175" width="120" height="390" fill="#f4d934" opacity=".58" stroke="#e0a600" stroke-width="4"/>${distractors}<circle cx="${x}" cy="${y}" r="28" fill="${inZone ? "#e0a600" : "#59605d"}" stroke="#df3c30" stroke-width="11"/>${control ? `<rect x="245" y="596" width="230" height="54" rx="13" fill="#202322"/><text x="360" y="632" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#fff">ENTRY COUNT: ${completed}</text>` : ""}</svg>`;
}
