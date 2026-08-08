/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Option 2 — re-validation of an AI-proposed fix before it is offered/applied.
 *
 * The generate agent returns untrusted text (ARCC AIQi — treat like SQLi): it
 * may be syntactically broken, may not actually clear the diagnostic, may
 * introduce a *new* problem, or — the subtle failure mode — may regenerate a
 * completely different, lint-clean query that drops the user's intent (e.g.
 * silently removing a WHERE clause). None of those may ever reach the editor.
 *
 * This module gathers the checks; it is pure given two injected capabilities so
 * it is unit-testable with no Monaco / cluster dependency:
 *   - `lint(query)` → the rule ids a query raises (the compiled-surface analyzer
 *     in production; a stub in tests),
 *   - `pipelineShape(query)` → the ordered command names of a query (a thin
 *     wrapper over `buildPipelineShape` in production; a stub in tests).
 *
 * A candidate is accepted only when ALL hold:
 *   1. parse-clean        — the analyzer raises no syntax error (caller's lint
 *                            returns a result; a hard parse failure surfaces as
 *                            `syntaxClean === false`),
 *   2. diagnostic cleared — the original ruleId is no longer raised,
 *   3. no new diagnostics — no ruleId is raised that the original lacked,
 *   4. shape preserved    — every original command kept in the same order; a
 *                            fix may insert a row-reordering `sort` (the
 *                            head-without-sort repair) but not drop, reorder, or
 *                            add an intent-changing command,
 *   5. token overlap      — shares at least `MIN_TOKEN_OVERLAP` of the original's
 *                            non-keyword tokens (catches whole-query regeneration
 *                            even when the shape coincidentally matches).
 */

import * as antlr from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { getPPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import { buildPipelineShape } from '../pipeline_shape';
import { createCompiledRuleNameToIndex } from '../rule_index';
import { LintRunContext } from '../types';

/** Minimum fraction of the original's content tokens the fix must retain. */
export const MIN_TOKEN_OVERLAP = 0.5;

export interface CandidateLintFacts {
  /** The rule ids the query raises (empty array = clean). */
  ruleIds: string[];
  /** False when the query failed to parse (syntax error / hard throw). */
  syntaxClean: boolean;
}

export interface ValidateCandidateDeps {
  /** Lint a query on the compiled surface and report rule ids + parse-cleanliness. */
  lint: (query: string) => CandidateLintFacts;
  /** The ordered pipeline command names of a query (e.g. ['searchCommand','evalCommand']). */
  pipelineShape: (query: string) => string[];
}

export interface ValidateCandidateResult {
  accepted: boolean;
  /** A machine-readable reason when rejected (for telemetry / debugging). */
  reason?:
    | 'empty'
    | 'syntax-error'
    | 'diagnostic-not-cleared'
    | 'new-diagnostic'
    | 'shape-changed'
    | 'low-overlap'
    | 'operator-inverted';
}

/** Comparison operators, longest-first so `<=`/`>=`/`<>`/`!=`/`==` win over the single-char forms. */
const COMPARISON_OPS = /(<=|>=|<>|!=|==|=|<|>)/g;

/**
 * Direction class of a comparison operator. An "inversion" is a flip to the
 * OPPOSING class (gt↔lt, eq↔neq); a same-class change (`>`→`>=`, a boundary
 * tweak) is a legitimate repair and is NOT flagged.
 */
type OpClass = 'gt' | 'lt' | 'eq' | 'neq';
const OP_CLASS: Record<string, OpClass> = {
  '>': 'gt',
  '>=': 'gt',
  '<': 'lt',
  '<=': 'lt',
  '=': 'eq',
  '==': 'eq',
  '!=': 'neq',
  '<>': 'neq',
};
const OPPOSING_CLASS: Record<OpClass, OpClass> = { gt: 'lt', lt: 'gt', eq: 'neq', neq: 'eq' };

/** Count comparison operators per direction class. */
function operatorClassMultiset(query: string): Map<OpClass, number> {
  const counts = new Map<OpClass, number>();
  for (const op of query.match(COMPARISON_OPS) ?? []) {
    const cls = OP_CLASS[op];
    if (cls) {
      counts.set(cls, (counts.get(cls) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Detect a predicate-operator INVERSION (`>`→`<`, `=`→`!=`, `>=`→`<`, …) the
 * token-overlap and command-shape checks are both blind to: `contentTokens`
 * matches only `[a-z0-9_.]+`, dropping every operator, so `age > 5` and
 * `age < 5` are indistinguishable to it, and the pipeline shape compares command
 * names only. Conservative on purpose — flags only a flip to the OPPOSING
 * direction class (a class loses an operator while its opposite gains one), so a
 * same-class boundary tweak (`>`→`>=`) or a repair that merely adds/removes an
 * operator (a cast guard) is not over-rejected. Range-operator flips are not
 * covered by any lint rule (`type-mismatch-numeric` excludes range operators),
 * so this is the only check that catches them.
 */
function isOperatorInverted(original: string, candidate: string): boolean {
  const origClasses = operatorClassMultiset(original);
  const candClasses = operatorClassMultiset(candidate);
  for (const [cls, n] of origClasses) {
    const opposite = OPPOSING_CLASS[cls];
    const lostInClass = (candClasses.get(cls) ?? 0) < n;
    const gainedInOpposite = (candClasses.get(opposite) ?? 0) > (origClasses.get(opposite) ?? 0);
    if (lostInClass && gainedInOpposite) {
      return true;
    }
  }
  return false;
}

/**
 * Commands a fix may INSERT without it counting as an intent change. A `sort`
 * only reorders rows — it never drops, filters, or aggregates them — so
 * inserting one is the canonical repair for `head-without-sort` (and similar
 * nondeterministic-order diagnostics). Any other inserted command (e.g. a
 * `stats` aggregation or a `where` filter) changes the result's contents and is
 * still rejected as `shape-changed`.
 */
const INSERTABLE_FIX_COMMANDS = new Set(['sortCommand']);

/**
 * Shape preservation with room for a fix to add a `sort`. Passes only when every
 * ORIGINAL command survives in the SAME ORDER (no drop, no reorder — `orig` is a
 * subsequence of `fix`) AND every extra command in `fix` is in
 * {@link INSERTABLE_FIX_COMMANDS}. This keeps the intent-guard the exact-equality
 * check gave (a regeneration that drops the user's `where`/`stats`, or reorders
 * the pipeline, is still caught) while letting the `head-without-sort` fix —
 * which must insert a `sort` before `head` — actually apply.
 */
export function isShapePreserved(orig: string[], fix: string[]): boolean {
  let matched = 0;
  for (const command of fix) {
    if (matched < orig.length && command === orig[matched]) {
      matched++; // consumes the next original command, in order
    } else if (!INSERTABLE_FIX_COMMANDS.has(command)) {
      return false; // an inserted command that is not a safe reorder
    }
  }
  return matched === orig.length; // every original command was preserved
}

/** Lowercase content tokens (identifiers/literals), excluding pure punctuation. */
function contentTokens(query: string): string[] {
  const matches: string[] = query.toLowerCase().match(/[a-z0-9_.]+/g) ?? [];
  return matches.filter((t) => t.length > 0);
}

/**
 * Fraction of the ORIGINAL query's content tokens that also appear in the
 * candidate. Asymmetric on purpose: a fix may add a token (a cast, a guard), but
 * dropping most of the original's tokens signals a regeneration, not a repair.
 */
export function tokenOverlap(original: string, candidate: string): number {
  const origTokens = contentTokens(original);
  if (origTokens.length === 0) {
    return 1;
  }
  const candidateSet = new Set(contentTokens(candidate));
  const shared = origTokens.filter((t) => candidateSet.has(t)).length;
  return shared / origTokens.length;
}

export function validateCandidateFix(
  original: string,
  candidate: string,
  originalRuleId: string,
  deps: ValidateCandidateDeps
): ValidateCandidateResult {
  const trimmed = candidate.trim();
  if (!trimmed) {
    return { accepted: false, reason: 'empty' };
  }

  const facts = deps.lint(trimmed);

  // 1. parse-clean
  if (!facts.syntaxClean) {
    return { accepted: false, reason: 'syntax-error' };
  }

  // 2. the original diagnostic must be gone
  if (facts.ruleIds.includes(originalRuleId)) {
    return { accepted: false, reason: 'diagnostic-not-cleared' };
  }

  // 3. no NEW diagnostic the original didn't already have
  const originalRuleIds = new Set(deps.lint(original).ruleIds);
  const introduced = facts.ruleIds.find((id) => !originalRuleIds.has(id));
  if (introduced) {
    return { accepted: false, reason: 'new-diagnostic' };
  }

  // 4. pipeline shape preserved (every original command kept, in order); a fix
  //    may insert a row-reordering `sort` (the head-without-sort repair) but not
  //    drop, reorder, or add an intent-changing command. See isShapePreserved.
  const origShape = deps.pipelineShape(original);
  const fixShape = deps.pipelineShape(trimmed);
  if (!isShapePreserved(origShape, fixShape)) {
    return { accepted: false, reason: 'shape-changed' };
  }

  // 5. token overlap — catches whole-query regeneration that happens to share a shape
  if (tokenOverlap(original, trimmed) < MIN_TOKEN_OVERLAP) {
    return { accepted: false, reason: 'low-overlap' };
  }

  // 6. operator inversion — a `>`→`<` / `=`→`!=` flip keeps every content token
  //    and the same shape, so steps 4-5 miss it; the lint rules miss range-op
  //    flips too. Reject a candidate that flips a predicate to its inverse.
  if (isOperatorInverted(original, trimmed)) {
    return { accepted: false, reason: 'operator-inverted' };
  }

  return { accepted: true };
}

/**
 * Lint a query on the compiled surface for re-validation (parse-clean + rule
 * ids). The model's real lint context is threaded in so context-aware rules
 * actually re-fire.
 */
export function compiledLintFacts(query: string, ctx?: LintRunContext): CandidateLintFacts {
  const validation = getPPLLanguageAnalyzer().validate(query);
  const result = getPPLLanguageAnalyzer().lint(query, ctx);
  return {
    ruleIds: result.diagnostics.map((d) => d.ruleId),
    syntaxClean: validation.isValid,
  };
}

/** The ordered pipeline command names of a query, for intent preservation. */
export function compiledPipelineShape(query: string): string[] {
  try {
    const cs = antlr.CharStream.fromString(query);
    const lx = new SimplifiedOpenSearchPPLLexer(cs);
    const ts = new antlr.CommonTokenStream(lx);
    const parser = new SimplifiedOpenSearchPPLParser(ts);
    parser.removeErrorListeners();
    const tree = parser.root();
    return buildPipelineShape(tree, createCompiledRuleNameToIndex()).stages.map((s) => s.command);
  } catch {
    return [];
  }
}

export function validatePPLLintFixCandidate({
  originalQuery,
  fixedQuery,
  ruleId,
  lintContext,
}: {
  originalQuery: string;
  fixedQuery: string;
  ruleId?: string;
  lintContext?: LintRunContext;
}): ValidateCandidateResult {
  return validateCandidateFix(originalQuery, fixedQuery, ruleId || '', {
    lint: (q) => compiledLintFacts(q, lintContext),
    pipelineShape: compiledPipelineShape,
  });
}
