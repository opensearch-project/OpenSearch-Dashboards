/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { DiagnosticRange } from './diagnostic';
import { findAllDescendantsByRule, findChildByRule, RuleNameToIndex } from './rule_index';
import { rangeFromContext } from './range_utils';
import { normalizeFieldPath } from './field_path';

const SOURCE_KEYWORDS = new Set(['source', 'index']);

/** Parser-neutral classification of a query's top-level source, stable across both grammar surfaces. */
export type TopLevelSource =
  | { kind: 'single-table'; value: string; range: DiagnosticRange }
  | { kind: 'pipe-first'; range: DiagnosticRange }
  | { kind: 'inconclusive' };

function normalizeSource(raw: string): string {
  return normalizeFieldPath(raw);
}

/** Pipe-first = first non-space char is `|`; mirrors the runtime bridge's prefix decision. */
export function isPipeFirstQuery(query: string): boolean {
  return query.trimStart().startsWith('|');
}

interface LocatedSource {
  value: string;
  node: ParserRuleContext;
}

/** Gather every top-level source candidate across both grammar surfaces; the count decides conclusiveness. */
function collectTopLevelSources(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): LocatedSource[] {
  const sources: LocatedSource[] = [];

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

export function classifyTopLevelSource(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex,
  query: string
): TopLevelSource {
  // Check the original text first: editor paths prepend a synthetic `source=t` so pipe-first parses,
  // and that fake source would otherwise read as a real one.
  if (isPipeFirstQuery(query)) {
    return { kind: 'pipe-first', range: rangeFromContext(tree) };
  }

  const sources = collectTopLevelSources(tree, ruleNameToIndex);

  if (sources.length === 0) {
    return { kind: 'inconclusive' };
  }

  if (sources.length > 1) {
    return { kind: 'inconclusive' };
  }

  const only = sources[0];
  return { kind: 'single-table', value: only.value, range: rangeFromContext(only.node) };
}
