/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { findAllDescendantsByRule, findChildByRule, RuleNameToIndex } from './rule_index';

// Shared helpers for reading and analyzing the string-literal *pattern* argument
// of the extraction commands `rex`/`parse`/`grok`. Two rules use these:
//   - `invalid-capture-group-name` locates the literal and scans its raw text for
//     named-group openers. It does not scan `grok` (a different dialect that
//     never reaches OpenSearch's capture-group name validator).
//   - `rex-scan-cost` locates the literal, decodes it, and (when the pattern
//     begins with a clean literal token) names a candidate prefilter term.
// Keeping the locate + decode + leading-token logic here avoids duplicating the
// literal-finding walk and centralizes the (subtle) PPL string decoding.

/**
 * Find the regex pattern's string-literal node for an extraction command node.
 *
 * `grok`/`parse` carry the pattern as a direct `stringLiteral` child. `rex`
 * nests it as `rexCommand → rexExpr → pattern=stringLiteral`, so a direct-child
 * lookup misses it and the descendant fallback runs: the pattern is always the
 * last string literal in source order (a quoted field/mode argument, when
 * present, precedes it), and `findAllDescendantsByRule` yields nodes in DFS
 * pop order rather than source order, so we select by source position.
 *
 * Works whether `command` is a `rexCommand`, `rexExpr`, `parseCommand`, or
 * `grokCommand` node: `rexOption` carries only integer/qualifiedName arguments
 * (never a `stringLiteral`), so the single pattern literal is unambiguous.
 */
export function findPatternLiteral(
  command: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): ParserRuleContext | undefined {
  const direct = findChildByRule(command, ruleNameToIndex, 'stringLiteral');
  if (direct) {
    return direct;
  }
  const descendants = findAllDescendantsByRule(command, ruleNameToIndex, 'stringLiteral');
  let pattern: ParserRuleContext | undefined;
  for (const node of descendants) {
    if (!pattern || (node.start?.start ?? -1) > (pattern.start?.start ?? -1)) {
      pattern = node;
    }
  }
  return pattern;
}

/**
 * Decode a PPL string literal's raw source text into the regex string the engine
 * actually runs. From the lexer (OpenSearchPPLLexer.g4:400-401, identical in the
 * simplified grammar):
 *
 *   DQUOTA_STRING: '"'  ( '\\'. | '""'  | ~('"' |'\\') )* '"';
 *   SQUOTA_STRING: '\'' ( '\\'. | '\'\''| ~('\''|'\\') )* '\'';
 *
 * There is no lexer action, so `getText()` is verbatim. Decoding:
 *   1. the outer delimiter is the first character (`"` or `'`; a backtick is an
 *      identifier quote and never a string literal);
 *   2. strip one outer delimiter from each end;
 *   3. collapse only the *outer* delimiter's doubling (`""` -> `"` inside a
 *      double-quoted literal); the other quote char is a plain literal, left
 *      untouched;
 *   4. backslashes are left verbatim — the lexer keeps them, so `\d`, `\.`, `\"`
 *      pass through to the regex engine unchanged.
 *
 * Defensive: a raw shorter than two chars, or one whose first char is not a
 * recognized delimiter, is returned unchanged (the grammar guarantees a proper
 * literal, but a caller passing an odd node then just yields no leading token).
 */
export function decodePatternLiteral(raw: string): string {
  if (raw.length < 2) {
    return raw;
  }
  const delim = raw[0];
  if (delim !== '"' && delim !== "'") {
    return raw;
  }
  const body = raw.slice(1, -1);
  const doubled = delim + delim;
  return body.split(doubled).join(delim);
}

// Length floor for a candidate prefilter token. Below this, tokens (`get`,
// `log`, `id`) are usually too low-selectivity to be worth suggesting; length is
// a usefulness heuristic, not a correctness lever.
const MIN_TOKEN_LENGTH = 4;

// Default-standard-analyzer stopwords. The default standard analyzer keeps these
// (its stop filter is `_none_`), but the `english`/`stop` analyzers drop them,
// and the linter cannot know which is configured — so a stopword is never a safe
// suggestion. Most are already below MIN_TOKEN_LENGTH; `with` is the one that
// would otherwise pass the length check.
const STOPWORDS: ReadonlySet<string> = new Set([
  'the',
  'and',
  'for',
  'not',
  'is',
  'at',
  'of',
  'on',
  'or',
  'to',
  'by',
  'with',
]);

// Regex metacharacters. The leading literal run ends at the first of these; a
// backslash is included so an escape (`\d`, `\.`, `\b`) is a hard stop — the
// conservative choice, since we never want to reason about what an escape means.
const REGEX_METACHAR = /[\\^$.|?*+()[\]{}]/;

// A clean, analyzer-safe candidate token: ASCII letters/digits only. This
// deliberately rejects a token that contains `_` or any non-ASCII letter,
// because the standard tokenizer (UAX#29) keeps `error_code` and `télévision`
// as single tokens — suggesting an ASCII substring of one (`error`, `vision`)
// would under-match and silently drop rows the regex matches.
const CLEAN_TOKEN = /^[A-Za-z0-9]+$/;
const PURE_NUMERIC = /^[0-9]+$/;

/**
 * True when the decoded regex has a top-level alternation (`GET|POST`): a `|` at
 * paren-depth 0, outside a character class, unescaped. When present, the leading
 * literal is not required by every branch, so no single leading token is a
 * substring of every match — the caller must emit no hint. A `|` nested inside a
 * group (`error(?<x>a|b)`) is depth 1 and does not count.
 *
 * Character-class handling is intentionally conservative: any imprecision only
 * ever causes an over-detection (bail = no hint), which is always safe.
 */
function hasTopLevelAlternation(decoded: string): boolean {
  let depth = 0;
  let inClass = false;
  for (let i = 0; i < decoded.length; i++) {
    const c = decoded[i];
    if (c === '\\') {
      i++; // skip the escaped character
      continue;
    }
    if (inClass) {
      if (c === ']') {
        inClass = false;
      }
      continue;
    }
    if (c === '[') {
      inClass = true;
    } else if (c === '(') {
      depth++;
    } else if (c === ')') {
      if (depth > 0) {
        depth--;
      }
    } else if (c === '|' && depth === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Given a *decoded* regex, return a candidate prefilter token when the pattern
 * begins with a clean literal run that yields one, or `undefined` otherwise.
 *
 * The guarantee this rests on: `rex`/`parse`/`grok` run their pattern unanchored
 * (find, not full-match), so for a pattern whose first characters form a literal
 * run with no quantifier/anchor/group/alternation affecting it, every matched
 * string contains that run as a contiguous substring. The returned token is
 * therefore a substring of every match — the one provably-safe superset term.
 * It is still only a *superset* (extraction is row-preserving, so a prefilter on
 * it changes `stats`/`count`/`sort` results); the caller must always present it
 * with that caveat and never auto-apply it.
 *
 * Steps (any may abort with `undefined`, always the safe default):
 *   1. bail on a top-level alternation anywhere;
 *   2. accumulate the leading literal run, stopping at the first metacharacter
 *      (an anchor/metaclass/group/quantifier as the first char yields an empty
 *      run and thus no token);
 *   3. split the run into analyzer-like tokens and keep only a clean ASCII token
 *      that is not pure-numeric, not a stopword, and at least MIN_TOKEN_LENGTH;
 *      return the longest survivor.
 */
export function leadingLiteralToken(decoded: string): string | undefined {
  if (hasTopLevelAlternation(decoded)) {
    return undefined;
  }

  let run = '';
  for (const ch of decoded) {
    if (REGEX_METACHAR.test(ch)) {
      break;
    }
    run += ch;
  }
  if (run.length === 0) {
    return undefined;
  }

  // Split on anything that is not a letter (any script), digit, or `_`, mirroring
  // the standard tokenizer's word boundaries. Tokens that keep a `_` or a
  // non-ASCII letter then fail CLEAN_TOKEN and are dropped rather than sliced.
  const rawTokens = run.split(/[^\p{L}\p{N}_]/u).filter(Boolean);
  let best: string | undefined;
  for (const token of rawTokens) {
    if (!CLEAN_TOKEN.test(token)) {
      continue; // contains `_` or a non-ASCII letter -> not safely representable
    }
    if (PURE_NUMERIC.test(token)) {
      continue; // low selectivity, usually a separate field
    }
    if (token.length < MIN_TOKEN_LENGTH) {
      continue;
    }
    if (STOPWORDS.has(token.toLowerCase())) {
      continue;
    }
    if (!best || token.length > best.length) {
      best = token;
    }
  }
  return best;
}
