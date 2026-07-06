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
import { damerauLevenshtein, nearestWithinThreshold } from './lint/edit_distance';

// Re-exported so existing callers/tests importing it from this module keep
// working after the implementation moved to the shared edit_distance module.
export { damerauLevenshtein };

/**
 * Documentation / test baseline of PPL command keyword *symbolic name* ->
 * lowercase spelling. As of the ATN-derived rewrite this is **no longer
 * load-bearing for the suggestion logic** — `buildCommandSuggestion` derives its
 * candidate set directly from the grammar's `commands` rule via the ATN (see
 * {@link commandCandidatesFromATN}), so a grammar rename (`WHERE` -> `FILTER`)
 * auto-propagates with zero edits here. The map survives only as a curated
 * baseline the grammar-guard test asserts the ATN-derived set still covers, and
 * as fixture data for the `suggestCommand` unit tests. It is intentionally
 * **not** re-exported from the `@osd/monaco` barrel.
 *
 * The set is a *superset* spanning both the simplified compiled grammar and the
 * full server grammar. Symbolic names absent from a given surface simply never
 * appear in that surface's `commands` rule, so listing extra names is harmless.
 */
export const PPL_COMMAND_KEYWORDS: ReadonlyMap<string, string> = new Map<string, string>([
  // Leading commands (statement position).
  ['SEARCH', 'search'],
  ['DESCRIBE', 'describe'],
  ['SHOW', 'show'],
  ['EXPLAIN', 'explain'],
  // Piped commands (post-`|` position) — present on at least one production
  // surface (verified against both lexer vocabularies).
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
  // Server-grammar / future command keywords. Harmless when absent from a
  // surface; matched by symbolic name only.
  ['MULTISEARCH', 'multisearch'],
  ['UNION', 'union'],
]);

/**
 * A confident, structured command-typo correction. The prose `message` is
 * composed here but is fully reconstructible from `typed`/`suggestion`, and the
 * structured `fix` drives a one-click Monaco quick-fix. Keeping identity
 * (`code`), prose (`message`), and the actionable correction (`fix`) as separate
 * fields lets a future producer (e.g. an AI suggester) populate the same
 * envelope without touching the listener, the marker builder, or the tests.
 */
export interface CommandSuggestion {
  /** Stable machine-readable identity, independent of the prose. */
  code: 'UNKNOWN_COMMAND';
  /** The misspelled token as typed, e.g. `wherre`. */
  typed: string;
  /** The nearest known command, e.g. `where`. */
  suggestion: string;
  /** Composed user-facing message; reconstructible from the parts. */
  message: string;
  /** Deterministic correction the marker builder turns into a lightbulb. */
  fix: { title: string; text: string };
}

/**
 * Largest expected-token set we treat as a "command position". A set larger than
 * this is a low-signal position (a dangling expression) where a command typo is
 * implausible, so we suppress to avoid false positives.
 *
 * Measured on both production surfaces (the bundled simplified grammar and a
 * live OpenSearch 3.7 server-grammar bundle):
 *   - command positions: simplified 40, server 101 expected tokens
 *   - dangling expressions: simplified 270-403, server 458-499
 * 150 sits cleanly in the gap (101, 270): above every command position with
 * headroom for grammar growth, below every expression position. Dangling
 * positions also tend to offend on `<EOF>`/null, which the identifier guard
 * already rejects — this cap is the second line of defense.
 */
const MAX_COMMAND_CANDIDATES = 150;

/**
 * Nearest command spelling to `typed` within an edit-distance threshold, or
 * undefined when none is close enough. Threshold is 1 for short names (< 8
 * chars) and 2 for longer ones, mirroring the base-plan design.
 */
export function suggestCommand(typed: string, candidates: Iterable<string>): string | undefined {
  const lower = typed.toLowerCase();
  const threshold = lower.length >= 8 ? 2 : 1;
  // A token no longer than the edit threshold is not a typo: rewriting 100% of a
  // 1-char token (`| a`) to reach a 2-char command (`ad`/`ml`) is a guess, not a
  // correction. Without this floor the suggestion fires constantly while the user
  // is mid-typing a fresh command and replaces ANTLR's real diagnostic.
  if (lower.length <= threshold) {
    return undefined;
  }
  return nearestWithinThreshold(typed, candidates, threshold);
}

/** Only word-shaped tokens can be command typos (rules out pipes, numbers, EOF). */
const IDENTIFIER_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

/**
 * A keyword-shaped symbolic name: all uppercase letters/digits. Command keywords
 * follow this convention (`WHERE`, `EVENTSTATS`); structural tokens (`PIPE`,
 * `COMMA`, `LPAREN`) and `EOF` either contain punctuation or — in `EOF`'s case —
 * are excluded a second time by the command-vocabulary intersection below, which
 * is what actually keeps `EOF` out of the candidate pool. Their lowercase form is
 * the user-facing spelling (`WHERE` -> `where`).
 */
const KEYWORD_SYMBOLIC_RE = /^[A-Z][A-Z0-9]*$/;

function isParser<T extends ATNSimulator>(
  recognizer: Recognizer<T>
): recognizer is Recognizer<T> & Parser {
  return typeof ((recognizer as unknown) as Parser).getExpectedTokens === 'function';
}

/**
 * The set of command spellings the grammar accepts, derived from the ATN rather
 * than a static map: FIRST(`commands`) is exactly the token types that can start
 * any `commands` alternative. This auto-adapts when the grammar adds, removes, or
 * renames a command — no manual map maintenance — and works identically for the
 * runtime `ParserInterpreter` and the compiled generated parser.
 *
 * Returns undefined when the grammar exposes no `commands` rule (so the suggestion
 * degrades to silence rather than guessing) or when FIRST(`commands`) is
 * implausibly large (a low-signal position; see {@link MAX_COMMAND_CANDIDATES}).
 * `ATN.nextTokens` is cached internally by antlr4ng after the first call for a
 * given state, so repeated invocations are cheap.
 */
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

/**
 * The command spellings present in the mismatch follow-set, intersected with the
 * grammar's command vocabulary. The intersection is load-bearing: a bare
 * keyword-shape filter would keep `EOF` (it is all-caps and alpha-only), so a
 * source-first `{EOF}` follow-set would yield a non-empty `{eof}` set and wrongly
 * short-circuit the PIPE-lookback fallback. Intersecting with FIRST(`commands`)
 * drops `EOF` and every non-command keyword by construction.
 */
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

/**
 * Whether the offending token immediately follows a `PIPE` in the raw token
 * stream (skipping hidden-channel tokens). This is the only reliable
 * command-position signal once ANTLR's error recovery has unwound the rule
 * context: on the server grammar a source-first `| <typo>` mismatch escapes the
 * `(PIPE commands)*` closure back to `root`, collapsing the follow-set to
 * `{EOF}` and pointing `offendingState` at `root` rather than `commands`. The
 * token stream is the one artifact recovery cannot corrupt. The scan is bounded
 * by the count of hidden tokens before the offender (typically one whitespace),
 * so it is effectively O(1).
 */
function offendingFollowsPipe<T extends ATNSimulator>(
  recognizer: Recognizer<T> & Parser,
  offendingSymbol: Token | null
): boolean {
  const tokenIndex = offendingSymbol?.tokenIndex;
  const stream = recognizer.inputStream;
  // `tokenIndex` is a valid stream index in practice, but a token synthesized
  // during error recovery can carry an out-of-range index; the upper bound keeps
  // the `stream.get(i)` lookback in range regardless.
  if (tokenIndex == null || tokenIndex <= 0 || !stream || tokenIndex > stream.size) {
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

/**
 * Decide whether a syntax error is a misspelled command and, if so, produce a
 * structured correction. Returns undefined when there is no confident
 * suggestion — the caller then keeps ANTLR's original message (no regression).
 *
 * Two paths reach the candidate set, both grammar-derived (no static keyword
 * map):
 *
 *  - **Primary** — the follow-set captured at the mismatch
 *    (`e.getExpectedTokens()`) intersected with the grammar's command
 *    vocabulary. Fires for pipe-first on every surface and for source-first on
 *    the compiled grammar, where the follow-set retains command keywords.
 *  - **Fallback** — on the server grammar a source-first `| <typo>` mismatch
 *    unwinds the `(PIPE commands)*` closure back to `root`, collapsing the
 *    follow-set to `{EOF}`. The primary path then yields nothing, so we recover
 *    command position from the raw token stream (PIPE-lookback) and use the full
 *    FIRST(`commands`) set as candidates.
 *
 * `e.getExpectedTokens()` is preferred over `recognizer.getExpectedTokens()`:
 * on a `ParserInterpreter` the latter returns the useless post-recovery set
 * `[EOF, PIPE]`, so it is used only as a fallback when `e` is null.
 */
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
    return undefined; // lexer error — no expected-token set to read.
  }

  // The grammar's command vocabulary, derived from the ATN. Doubles as the
  // "is this already a valid command" oracle and as the fallback candidate set.
  const validCommands = commandCandidatesFromATN(recognizer);
  if (!validCommands || validCommands.size === 0) {
    return undefined; // grammar exposes no `commands` rule — can't reason here.
  }

  // A correctly-spelled command here means the error is structural, not a typo.
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

  if (!candidates || candidates.size === 0) {
    return undefined; // not a command position.
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
    // Title matches field_validation's `Replace with "..."` convention.
    fix: { title: `Replace with "${suggestion}"`, text: suggestion },
  };
}
