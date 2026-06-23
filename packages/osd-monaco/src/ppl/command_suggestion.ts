/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IntervalSet,
  Parser,
  RecognitionException,
  Recognizer,
  Token,
  ATNSimulator,
} from 'antlr4ng';

export const PPL_COMMAND_KEYWORDS: ReadonlyMap<string, string> = new Map<string, string>([
  ['SEARCH', 'search'],
  ['DESCRIBE', 'describe'],
  ['SHOW', 'show'],
  ['EXPLAIN', 'explain'],
  ['WHERE', 'where'],
  ['FIELDS', 'fields'],
  ['TABLE', 'table'],
  ['RENAME', 'rename'],
  ['STATS', 'stats'],
  ['EVENTSTATS', 'eventstats'],
  ['DEDUP', 'dedup'],
  ['SORT', 'sort'],
  ['EVAL', 'eval'],
  ['HEAD', 'head'],
  ['BIN', 'bin'],
  ['TOP', 'top'],
  ['RARE', 'rare'],
  ['PARSE', 'parse'],
  ['SPATH', 'spath'],
  ['REGEX', 'regex'],
  ['REX', 'rex'],
  ['GROK', 'grok'],
  ['PATTERNS', 'patterns'],
  ['KMEANS', 'kmeans'],
  ['AD', 'ad'],
  ['ML', 'ml'],
  ['FILLNULL', 'fillnull'],
  ['FLATTEN', 'flatten'],
  ['EXPAND', 'expand'],
  ['TRENDLINE', 'trendline'],
  ['TIMECHART', 'timechart'],
  ['APPENDCOL', 'appendcol'],
  ['APPEND', 'append'],
  ['JOIN', 'join'],
  ['LOOKUP', 'lookup'],
  ['REVERSE', 'reverse'],
  ['REPLACE', 'replace'],
  ['MULTISEARCH', 'multisearch'],
  ['UNION', 'union'],
]);

export interface CommandSuggestion {
  code: 'UNKNOWN_COMMAND';
  typed: string;
  suggestion: string;
  message: string;
  fix: { title: string; text: string };
}

// Above this token-set size, the position is not a command slot (low-signal).
const MAX_COMMAND_CANDIDATES = 150;

export function damerauLevenshtein(a: string, b: string, maxDistance: number): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prevPrev = new Array<number>(n + 1).fill(0);
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, prevPrev[j - 2] + 1);
      }
      curr[j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }
    const spare = prevPrev;
    prevPrev = prev;
    prev = curr;
    curr = spare;
  }
  return prev[n];
}

export function suggestCommand(typed: string, candidates: Iterable<string>): string | undefined {
  const lower = typed.toLowerCase();
  const threshold = lower.length >= 8 ? 2 : 1;
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    if (Math.abs(candidate.length - lower.length) > threshold) {
      continue;
    }
    const distance = damerauLevenshtein(lower, candidate, threshold);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
      if (bestDistance === 1) {
        break;
      }
    }
  }
  return best && bestDistance <= threshold ? best : undefined;
}

const IDENTIFIER_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

const KEYWORD_SYMBOLIC_RE = /^[A-Z][A-Z0-9]*$/;

function isParser<T extends ATNSimulator>(
  recognizer: Recognizer<T>
): recognizer is Recognizer<T> & Parser {
  return typeof ((recognizer as unknown) as Parser).getExpectedTokens === 'function';
}

function commandCandidatesFromATN<T extends ATNSimulator>(
  recognizer: Recognizer<T> & Parser
): Set<string> | undefined {
  const ruleIndex = recognizer.getRuleIndex('commands');
  if (ruleIndex < 0) {
    return undefined;
  }
  const startState = recognizer.atn.ruleToStartState[ruleIndex];
  if (!startState) {
    return undefined;
  }
  const tokenTypes = recognizer.atn.nextTokens(startState).toArray();
  if (tokenTypes.length > MAX_COMMAND_CANDIDATES) {
    return undefined;
  }
  const spellings = new Set<string>();
  for (const tokenType of tokenTypes) {
    const symbolic = recognizer.vocabulary.getSymbolicName(tokenType);
    if (symbolic && KEYWORD_SYMBOLIC_RE.test(symbolic)) {
      spellings.add(symbolic.toLowerCase());
    }
  }
  return spellings.size > 0 ? spellings : undefined;
}

function commandSpellingsInFollowSet(
  expected: IntervalSet,
  commandSet: ReadonlySet<string>,
  vocabulary: { getSymbolicName(tokenType: number): string | null }
): Set<string> {
  const spellings = new Set<string>();
  const tokenTypes = expected.toArray();
  if (tokenTypes.length > MAX_COMMAND_CANDIDATES) {
    return spellings;
  }
  for (const tokenType of tokenTypes) {
    const symbolic = vocabulary.getSymbolicName(tokenType);
    if (symbolic) {
      const spelling = symbolic.toLowerCase();
      if (commandSet.has(spelling)) {
        spellings.add(spelling);
      }
    }
  }
  return spellings;
}

/** Whether the offending token immediately follows a PIPE in the token stream. */
function offendingFollowsPipe<T extends ATNSimulator>(
  recognizer: Recognizer<T> & Parser,
  offendingSymbol: Token | null
): boolean {
  const tokenIndex = offendingSymbol?.tokenIndex;
  const stream = recognizer.inputStream;
  if (tokenIndex == null || tokenIndex <= 0 || !stream) {
    return false;
  }
  for (let i = tokenIndex - 1; i >= 0; i--) {
    const prev = stream.get(i);
    if (prev.channel !== Token.DEFAULT_CHANNEL) {
      continue;
    }
    return recognizer.vocabulary.getSymbolicName(prev.type) === 'PIPE';
  }
  return false;
}

export function buildCommandSuggestion<S extends Token, T extends ATNSimulator>(
  recognizer: Recognizer<T>,
  offendingSymbol: S | null,
  e: RecognitionException | null
): CommandSuggestion | undefined {
  const typed = offendingSymbol?.text;
  if (!typed || !IDENTIFIER_RE.test(typed)) {
    return undefined;
  }
  if (!isParser(recognizer)) {
    return undefined;
  }

  const validCommands = commandCandidatesFromATN(recognizer);
  if (!validCommands) {
    return undefined;
  }

  if (validCommands.has(typed.toLowerCase())) {
    return undefined;
  }

  const expected = e?.getExpectedTokens() ?? recognizer.getExpectedTokens();
  const followSetCommands = expected
    ? commandSpellingsInFollowSet(expected, validCommands, recognizer.vocabulary)
    : undefined;

  const candidates =
    followSetCommands && followSetCommands.size > 0
      ? followSetCommands
      : offendingFollowsPipe(recognizer, offendingSymbol)
      ? validCommands
      : undefined;

  if (!candidates) {
    return undefined;
  }

  const suggestion = suggestCommand(typed, candidates);
  if (!suggestion) {
    return undefined;
  }

  return {
    code: 'UNKNOWN_COMMAND',
    typed,
    suggestion,
    message: `Unknown command "${typed}". Did you mean "${suggestion}"?`,
    fix: { title: `Replace with "${suggestion}"`, text: suggestion },
  };
}
