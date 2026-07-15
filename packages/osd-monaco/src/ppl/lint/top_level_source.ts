/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { DiagnosticRange } from './diagnostic';
import { findAllDescendantsByRule, findChildByRule, RuleNameToIndex } from './rule_index';
import { rangeFromContext } from './range_utils';
import { normalizeFieldPath } from './field_path';

/** Source keywords whose RHS names the index on the simplified search surface. */
const SOURCE_KEYWORDS = new Set(['source', 'index']);

/**
 * Parser-neutral classification of a query's top-level source.
 *
 * Source-metadata rules (wildcard-source-zero-match) and explain-backed rules
 * both need to know what the query reads from, but neither should own the source
 * parser or depend on the other's. This shared helper produces one result on
 * both grammar surfaces so those rules consume a stable shape.
 *
 *  - `single-table`  — one concrete source name (possibly a wildcard pattern).
 *  - `pipe-first`    — a pipe-first query (`| where ...`) with no leading source.
 *  - `inconclusive`  — no source recoverable, or more than one top-level source
 *                      (union/multisearch), which these rules do not classify.
 */
export type TopLevelSource =
  | { kind: 'single-table'; value: string; range: DiagnosticRange }
  | { kind: 'pipe-first'; range: DiagnosticRange }
  | { kind: 'inconclusive' };

/** Strip a single enclosing quote pair from a source token (kept identical to
 * how field paths are normalized so a quoted source name compares cleanly). */
function normalizeSource(raw: string): string {
  return normalizeFieldPath(raw);
}

/**
 * Whether a query is pipe-first (its first non-space character is `|`). This is
 * a run-local text derivation — cheaper and surface-independent than inspecting
 * the tree, and it matches how the runtime bridge decides to prepend its
 * pipe-first prefix.
 */
export function isPipeFirstQuery(query: string): boolean {
  return query.trimStart().startsWith('|');
}

/**
 * A single located source name plus the node whose span it occupies.
 */
interface LocatedSource {
  value: string;
  node: ParserRuleContext;
}

/**
 * Collect top-level source names across both grammar surfaces:
 *  - Runtime bundle: `fromClause` → `tableSource` carries the source name.
 *  - Compiled-simplified: `source=idx` parses as a `searchFieldComparison`
 *    whose leading `fieldExpression` is the `source`/`index` keyword and whose
 *    `searchLiteral` is the index name.
 * Only names inside an alternate-source subtree (union/subsearch) matter to the
 * caller; here we gather every candidate and let the count decide conclusiveness.
 */
function collectTopLevelSources(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): LocatedSource[] {
  const sources: LocatedSource[] = [];

  // Runtime surface: fromClause → tableSource.
  for (const fromClause of findAllDescendantsByRule(tree, ruleNameToIndex, 'fromClause')) {
    for (const tableSource of findAllDescendantsByRule(
      fromClause,
      ruleNameToIndex,
      'tableSource'
    )) {
      const value = normalizeSource(tableSource.getText());
      if (value) {
        sources.push({ value, node: tableSource });
      }
    }
  }

  // Compiled-simplified surface: `source=idx` → searchFieldComparison.
  for (const cmp of findAllDescendantsByRule(tree, ruleNameToIndex, 'searchFieldComparison')) {
    const fieldExpr = findChildByRule(cmp, ruleNameToIndex, 'fieldExpression');
    if (!fieldExpr || !SOURCE_KEYWORDS.has(fieldExpr.getText().toLowerCase())) {
      continue;
    }
    const literal = findChildByRule(cmp, ruleNameToIndex, 'searchLiteral');
    if (!literal) {
      continue;
    }
    const value = normalizeSource(literal.getText());
    if (value) {
      sources.push({ value, node: literal });
    }
  }

  return sources;
}

/**
 * Classify the top-level source of a parsed query. When exactly one source name
 * is present we report it; zero (with a pipe-first query) is `pipe-first`;
 * anything else — no source, or more than one (union/multisearch) — is
 * `inconclusive`.
 */
export function classifyTopLevelSource(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex,
  query: string
): TopLevelSource {
  // Check pipe-first from the ORIGINAL query text before inspecting the tree:
  // both editor paths prepend a synthetic `source=t` prefix so a pipe-first
  // query can parse, and that fake source would otherwise read as a real one.
  if (isPipeFirstQuery(query)) {
    return { kind: 'pipe-first', range: rangeFromContext(tree) };
  }

  const sources = collectTopLevelSources(tree, ruleNameToIndex);

  if (sources.length === 0) {
    return { kind: 'inconclusive' };
  }

  if (sources.length > 1) {
    // Multiple recognizable top-level sources — not a single-table query.
    return { kind: 'inconclusive' };
  }

  const only = sources[0];
  return { kind: 'single-table', value: only.value, range: rangeFromContext(only.node) };
}
