export interface ScoreResult {
  parsedAnswer: string;
  correct: boolean;
  needsReview: boolean;
  method: "exact-option-v1" | "terminal-option-v2" | "terminal-option-v3" | "declared-answer-v4";
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

/**
 * Prospective scorer for discovery campaigns. It prefers an explicit terminal
 * answer before falling back to the conservative unique-option rule. Published
 * v1 campaign records remain frozen under exact-option-v1.
 */
export function scoreTerminalOption(
  rawResponse: string,
  expectedAnswer: string,
  options: string[],
): ScoreResult {
  const normalizedOptions = options.map((option) => ({ option, normalized: normalize(option) }));
  const resolveExact = (value: string) => {
    const normalizedValue = normalize(value);
    return normalizedOptions.find(({ normalized }) => normalized === normalizedValue);
  };
  const terminalMarkers = [
    ...rawResponse.matchAll(
      /(?:^|\n)\s*[*_]*(?:final\s+answer|correct\s+answer|answer)[*_]*\s*:\s*([^\n]+)/giu,
    ),
  ];
  const marked = terminalMarkers.length
    ? resolveExact(terminalMarkers[terminalMarkers.length - 1]![1]!)
    : undefined;
  const lines = rawResponse.split(/\r?\n/u).filter((line) => line.trim().length > 0);
  const lastLine = lines.length ? resolveExact(lines[lines.length - 1]!) : undefined;
  const selected = marked ?? lastLine ?? resolveExact(rawResponse);
  if (selected) {
    return {
      parsedAnswer: selected.option,
      correct: normalize(selected.option) === normalize(expectedAnswer),
      needsReview: false,
      method: "terminal-option-v2",
    };
  }

  const normalizedResponse = normalize(rawResponse);
  const matches = normalizedOptions.filter(({ normalized }) => {
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "u").test(normalizedResponse);
  });
  if (matches.length === 1) {
    return {
      parsedAnswer: matches[0]!.option,
      correct: normalize(matches[0]!.option) === normalize(expectedAnswer),
      needsReview: false,
      method: "terminal-option-v2",
    };
  }
  return {
    parsedAnswer: "",
    correct: false,
    needsReview: true,
    method: "terminal-option-v2",
  };
}

/**
 * Prospective scorer for protocols that permit a final answer sentence rather
 * than requiring the last line to contain only the option. The scorer only
 * accepts a terminal line/marked answer containing exactly one allowed option;
 * mentions elsewhere in the rationale cannot override an ambiguous ending.
 */
export function scoreTerminalOptionV3(
  rawResponse: string,
  expectedAnswer: string,
  options: string[],
): ScoreResult {
  const normalizedOptions = options.map((option) => ({ option, normalized: normalize(option) }));
  const uniqueOptionIn = (value: string) => {
    const normalizedValue = normalize(value);
    const matches = normalizedOptions.filter(({ normalized }) => {
      const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "u").test(normalizedValue);
    });
    return matches.length === 1 ? matches[0] : undefined;
  };
  const terminalMarkers = [
    ...rawResponse.matchAll(
      /(?:^|\n)\s*[*_]*(?:final\s+answer|correct\s+answer|answer)[*_]*\s*:\s*([^\n]+)/giu,
    ),
  ];
  const marked = terminalMarkers.length
    ? uniqueOptionIn(terminalMarkers[terminalMarkers.length - 1]![1]!)
    : undefined;
  const lines = rawResponse.split(/\r?\n/u).filter((line) => line.trim().length > 0);
  const lastLine = lines.length ? uniqueOptionIn(lines[lines.length - 1]!) : undefined;
  const exactWholeResponse =
    normalizedOptions.find(({ normalized }) => normalized === normalize(rawResponse)) ?? undefined;
  const selected = marked ?? lastLine ?? exactWholeResponse;
  if (selected) {
    return {
      parsedAnswer: selected.option,
      correct: normalize(selected.option) === normalize(expectedAnswer),
      needsReview: false,
      method: "terminal-option-v3",
    };
  }
  return {
    parsedAnswer: "",
    correct: false,
    needsReview: true,
    method: "terminal-option-v3",
  };
}

/**
 * Prospective forced-choice scorer that distinguishes an unambiguous declared
 * answer outside the allowed set from a parser failure. An outside-set claim
 * is a substantive incorrect answer; genuinely ambiguous or undeclared text
 * still goes to review and receives no hardness credit.
 */
export function scoreDeclaredAnswerV4(
  rawResponse: string,
  expectedAnswer: string,
  options: string[],
): ScoreResult {
  const terminal = scoreTerminalOptionV3(rawResponse, expectedAnswer, options);
  if (!terminal.needsReview) return { ...terminal, method: "declared-answer-v4" };

  const declarations = [
    ...rawResponse.matchAll(
      /(?:total(?:\s+number)?\s+(?:is|of)|correct\s+(?:answer|number)\s+(?:is|:)|final\s+answer\s*(?:is|:)|answer\s*(?:is|:))\s*[*_]*([\p{L}\p{N}'-]+)/giu,
    ),
  ];
  const claim = declarations.at(-1)?.[1];
  const normalizedClaim = claim ? normalize(claim) : "";
  if (
    !normalizedClaim ||
    ["either", "maybe", "approximately", "about", "unclear", "unknown"].includes(normalizedClaim)
  ) {
    return { parsedAnswer: "", correct: false, needsReview: true, method: "declared-answer-v4" };
  }
  const selected = options.find((option) => normalize(option) === normalizedClaim);
  return {
    parsedAnswer: selected ?? `[outside options: ${claim}]`,
    correct: Boolean(selected && normalize(selected) === normalize(expectedAnswer)),
    needsReview: false,
    method: "declared-answer-v4",
  };
}
