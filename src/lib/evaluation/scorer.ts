export interface ScoreResult {
  parsedAnswer: string;
  correct: boolean;
  needsReview: boolean;
  method: "exact-option-v1";
}

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim();

export function scoreExactOption(
  rawResponse: string,
  expectedAnswer: string,
  options: string[],
): ScoreResult {
  const normalizedResponse = normalize(rawResponse);
  const normalizedOptions = options.map((option) => ({ option, normalized: normalize(option) }));
  const exact = normalizedOptions.find(({ normalized }) => normalized === normalizedResponse);
  if (exact) {
    return {
      parsedAnswer: exact.option,
      correct: normalize(exact.option) === normalize(expectedAnswer),
      needsReview: false,
      method: "exact-option-v1",
    };
  }

  const matches = normalizedOptions.filter(({ normalized }) => {
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "u").test(normalizedResponse);
  });

  if (matches.length !== 1) {
    return {
      parsedAnswer: "",
      correct: false,
      needsReview: true,
      method: "exact-option-v1",
    };
  }

  return {
    parsedAnswer: matches[0]!.option,
    correct: normalize(matches[0]!.option) === normalize(expectedAnswer),
    needsReview: false,
    method: "exact-option-v1",
  };
}
