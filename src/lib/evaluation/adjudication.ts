export interface DeclaredAnswerAdjudication {
  claimedAnswer: string;
  basis: "explicit-declaration" | "terminal-standalone";
  withinOptions: boolean;
}

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function optionClaims(value: string, options: string[]) {
  const normalized = normalize(value);
  return options.filter((option) => {
    const escaped = escapeRegExp(normalize(option));
    return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "u").test(normalized);
  });
}

function outsideAtomicClaim(value: string, options: string[]) {
  const markdownToken = value.match(/[*_`]{1,3}\s*([\p{L}\p{N}'-]+)\s*[*_`]{1,3}/u)?.[1];
  const candidate =
    markdownToken ?? value.match(/^\s*(?:approximately\s+|about\s+)?([\p{L}\p{N}'-]+)/iu)?.[1];
  if (!candidate) return undefined;
  if (options.every((option) => /^[+-]?\d+(?:\.\d+)?$/u.test(option.trim())))
    return /^[+-]?\d+(?:\.\d+)?$/u.test(candidate) ? candidate : undefined;
  if (options.every((option) => /^\p{L}$/u.test(option.trim())))
    return /^\p{L}$/u.test(candidate) ? candidate : undefined;
  return candidate;
}

/**
 * Answer-key-blind adjudication for a response that the frozen scorer left pending.
 * It receives allowed options but never the expected answer. Conflicting or hedged
 * declarations remain unresolved. An unambiguous outside-set claim is substantive.
 */
export function adjudicateExplicitDeclaration(
  rawResponse: string,
  options: string[],
): DeclaredAnswerAdjudication | undefined {
  const ambiguity =
    /\b(?:either|maybe|possibly|probably|approximately|about|unclear|unknown|cannot determine|can't determine)\b/iu;
  const lines = rawResponse.split(/\r?\n/u).filter((line) => line.trim().length > 0);
  const terminal = lines.at(-1)?.trim() ?? "";
  const terminalMarkedAnswer = terminal.match(
    /^\s*\*{0,3}\s*(?:(?:correct|final)\s+)?answer\s*[:=-]\s*\*{0,3}\s*\*{1,3}\s*([\p{L}\p{N}'+.-]+)\s*\*{1,3}/iu,
  )?.[1];
  if (terminalMarkedAnswer && !ambiguity.test(terminalMarkedAnswer)) {
    const option = options.find(
      (candidate) => normalize(candidate) === normalize(terminalMarkedAnswer),
    );
    if (option)
      return { claimedAnswer: option, basis: "terminal-standalone", withinOptions: true };
  }
  const terminalLabel = terminal.match(
    /^\s*[*_`]{0,3}\s*(?:(?:correct|final)\s+)?answer\s*[:=-]\s*[*_`]{0,3}\s*[*_`]{0,3}\s*([^.!?\n]+?)\s*[*_`]{0,3}\s*[.!]?\s*$/iu,
  )?.[1];
  if (terminalLabel && !ambiguity.test(terminalLabel)) {
    const leadingMarked = terminalLabel.match(/^\s*[*_`]{1,3}\s*([\p{L}\p{N}'+.-]+)\s*[*_`]{1,3}/u)?.[1];
    const leadingOption = leadingMarked
      ? options.find((option) => normalize(option) === normalize(leadingMarked))
      : undefined;
    if (leadingOption)
      return { claimedAnswer: leadingOption, basis: "terminal-standalone", withinOptions: true };
    const matches = optionClaims(terminalLabel, options);
    if (matches.length === 1)
      return { claimedAnswer: matches[0]!, basis: "terminal-standalone", withinOptions: true };
    if (matches.length === 0) {
      const outside = outsideAtomicClaim(terminalLabel, options);
      if (outside)
        return { claimedAnswer: outside, basis: "terminal-standalone", withinOptions: false };
    }
  }
  if (terminal && terminal.length <= 48 && !ambiguity.test(terminal)) {
    const terminalOptions = optionClaims(terminal, options);
    if (terminalOptions.length === 1)
      return {
        claimedAnswer: terminalOptions[0]!,
        basis: "terminal-standalone",
        withinOptions: true,
      };
    if (terminalOptions.length === 0) {
      const outside = terminal.match(
        /^\s*[*_`]{0,3}\s*([\p{L}\p{N}'-]+)\s*[*_`]{0,3}\s*[.!]?\s*$/u,
      )?.[1];
      if (outside)
        return { claimedAnswer: outside, basis: "terminal-standalone", withinOptions: false };
    }
  }
  if (options.every((option) => /^[+-]?\d+(?:\.\d+)?$/u.test(option.trim()))) {
    const recentNumericClaims = lines.slice(-4).flatMap((line) => {
      const match = line.match(
        /^\s*[*_`]{1,3}\s*([+-]?\d+(?:\.\d+)?)\s*[*_`]{1,3}(?:\s+(?:different\s+)?cells?\b.*)?\s*[.!]?\s*$/iu,
      );
      return match ? [match[1]!] : [];
    });
    const uniqueRecentClaims = [...new Set(recentNumericClaims)];
    if (uniqueRecentClaims.length === 1)
      return {
        claimedAnswer: uniqueRecentClaims[0]!,
        basis: "terminal-standalone",
        withinOptions: options.includes(uniqueRecentClaims[0]!),
      };
  }
  const claims: DeclaredAnswerAdjudication[] = [];
  const declarations = [
    /(?:the\s+)?(?:correct|final)\s+(?:answer|panel|graph|option|choice|letter|count|number|output|value|quadrant|structure)\s*(?:is|:)\s*([^.!?\n]+)/giu,
    /(?:the\s+)?(?:answer|result|output|count|number|value)\s*(?:is|:)\s*([^.!?\n]+)/giu,
    /(?:is|lies|appears)\s+located\s+(?:in|at)\s+([^.!?\n]+)/giu,
    /(?:i|we)\s+(?:choose|select)\s+([^.!?\n]+)/giu,
    /there\s+(?:are|is)\s+exactly\s+([^.!?\n]+)/giu,
  ];

  for (const pattern of declarations) {
    for (const match of rawResponse.matchAll(pattern)) {
      const clause = match[1]!.trim();
      if (ambiguity.test(clause)) continue;
      const matches = optionClaims(clause, options);
      if (matches.length === 1) {
        claims.push({ claimedAnswer: matches[0]!, basis: "explicit-declaration", withinOptions: true });
      } else if (matches.length === 0) {
        const outside = outsideAtomicClaim(clause, options);
        if (outside)
          claims.push({ claimedAnswer: outside, basis: "explicit-declaration", withinOptions: false });
      }
    }
  }

  const normalizedClaims = new Set(claims.map((claim) => normalize(claim.claimedAnswer)));
  if (claims.length > 0 && normalizedClaims.size === 1) return claims[0];
  if (normalizedClaims.size > 1) return undefined;

  if (!terminal || terminal.length > 48 || ambiguity.test(terminal)) return undefined;
  const terminalOptions = optionClaims(terminal, options);
  if (terminalOptions.length === 1)
    return {
      claimedAnswer: terminalOptions[0]!,
      basis: "terminal-standalone",
      withinOptions: true,
    };
  if (terminalOptions.length > 1) return undefined;
  const outside = terminal.match(/^\s*[*_`]{0,3}\s*([\p{L}\p{N}'-]+)\s*[*_`]{0,3}\s*[.!]?\s*$/u)?.[1];
  return outside ? { claimedAnswer: outside, basis: "terminal-standalone", withinOptions: false } : undefined;
}
