/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { classifyTopLevelSource } from '../top_level_source';

/**
 * Convert a PPL wildcard pattern (`*` matches any run of characters) into a
 * RegExp anchored to the full string.
 */
function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

/**
 * Flag a wildcard `source=` pattern that matches none of the indices visible to
 * the user. Advisory only: the query is valid PPL and returns zero rows.
 *
 * Deliberately not `sourceScoped` — it reads the cluster-wide index list rather
 * than the selected dataset's field metadata, so it must still fire when the
 * query's source differs from the active dataset.
 */
export const wildcardSourceZeroMatchDetector: Detector = (
  tree,
  config,
  context,
  ruleNameToIndex
) => {
  const visibleIndices = context.visibleIndices;
  // Self-suppress when the list is absent OR empty: an empty list means "we don't
  // know what is visible", not "every pattern matches nothing". Without this,
  // every wildcard source would false-fire as "matched 0 of 0".
  if (!visibleIndices || visibleIndices.length === 0) {
    return [];
  }

  // Reuse the shared classifier rather than walking `fromClause` directly: an
  // unquoted `source=logs-*` parses as a `searchFieldComparison` + `searchLiteral`,
  // not a `tableSource`, and only the classifier covers both shapes. It also
  // normalizes quoting, so the pattern is compared and displayed unquoted.
  const source = classifyTopLevelSource(tree, ruleNameToIndex, context.isPipeFirst ?? false);
  if (source.kind !== 'single-table' || !source.value.includes('*')) {
    return [];
  }

  const pattern = source.value;
  const matcher = wildcardToRegExp(pattern);
  if (visibleIndices.some((index) => matcher.test(index))) {
    return [];
  }

  const diagnostic: Diagnostic = {
    ruleId: config.id,
    severity: config.severity,
    message: config.message,
    range: source.range,
    docUrl: config.docUrl,
  };

  return [diagnostic];
};
