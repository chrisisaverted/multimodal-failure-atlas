import { z } from "zod";
import { failureModes } from "./catalogue";
import { generateInstance } from "./generators";
import { scoreExactOption } from "./evaluation/scorer";
import type { Citation, DiagnosticInstance, DiagnosticParams, FailureMode, GeneratorKey } from "./types";
import { citationsById } from "./sources";

export const diagnosticParamsSchema = z.object({
  seed: z.number().int().nonnegative(),
  difficulty: z.number().min(0).max(100),
  variant: z.number().int().min(0).max(1000),
});

export interface FailureModule {
  id: string;
  metadata: FailureMode;
  parameterSchema: typeof diagnosticParamsSchema;
  controls: Array<{ key: keyof DiagnosticParams; label: string; min: number; max: number; step: number }>;
  citations: Citation[];
  generate(params: DiagnosticParams): DiagnosticInstance;
  groundTruth(instance: DiagnosticInstance): string;
  score(rawResponse: string, instance: DiagnosticInstance): ReturnType<typeof scoreExactOption>;
  explanation: Pick<FailureMode, "mechanism" | "alternatives" | "disconfirmingTest">;
  validate(instance: DiagnosticInstance): string[];
}

function buildModule(mode: FailureMode & { generator: GeneratorKey }): FailureModule {
  return {
    id: mode.id,
    metadata: mode,
    parameterSchema: diagnosticParamsSchema,
    controls: [
      { key: "difficulty", label: "Difficulty", min: 0, max: 100, step: 1 },
      { key: "variant", label: "Phase / variant", min: 0, max: 13, step: 1 },
    ],
    citations: mode.sourceIds.flatMap((id) => {
      const citation = citationsById.get(id);
      return citation ? [citation] : [];
    }),
    generate: (params) => generateInstance(mode.generator, diagnosticParamsSchema.parse(params)),
    groundTruth: (instance) => instance.answer,
    score: (rawResponse, instance) =>
      scoreExactOption(rawResponse, instance.answer, instance.answerOptions ?? [instance.answer]),
    explanation: {
      mechanism: mode.mechanism,
      alternatives: mode.alternatives,
      disconfirmingTest: mode.disconfirmingTest,
    },
    validate: (instance) => {
      const errors: string[] = [];
      if (instance.generator !== mode.generator) errors.push("generator identity mismatch");
      if (!instance.question.endsWith("?")) errors.push("question must end in a question mark");
      if (!instance.answerOptions?.includes(instance.answer))
        errors.push("ground truth is absent from options");
      if (!instance.minimalPairDescription) errors.push("minimal-pair contract is missing");
      return errors;
    },
  };
}

export const failureModules = failureModes
  .filter((mode): mode is FailureMode & { generator: GeneratorKey } => Boolean(mode.generator))
  .map(buildModule);

export const failureModulesById = new Map(failureModules.map((module) => [module.id, module]));
