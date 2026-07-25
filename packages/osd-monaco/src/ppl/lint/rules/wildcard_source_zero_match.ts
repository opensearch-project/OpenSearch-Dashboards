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

/** Max candidate index names surfaced in the hover card. */
const MAX_CANDIDATES = 5;

/** Shortest leading literal run worth offering a "did you mean" hint for. */
const MIN_PREFIX_LENGTH = 2;

/**
 * Pick up to {@link MAX_CANDIDATES} visible indices whose name starts with the
 * pattern's leading literal run (the text before its first `*`) — e.g. `logs-*`
 * surfaces `logs_2024`, `logs_2025`. One prefix check per visible index, computed
 * only on the rare zero-match path where the rule has already fired.
 */
function nearbyCandidates(pattern: string, visibleIndices: string[]): string[] {
  const literalPrefix = pattern.slice(0, pattern.indexOf('*')).replace(/[^a-zA-Z0-9]+$/, '');
  if (literalPrefix.length < MIN_PREFIX_LENGTH) {
    return [];
  }
  const lower = literalPrefix.toLowerCase();
  const out: string[] = [];
  for (const index of visibleIndices) {
    // Prefix match, not substring: `logs` should surface `logs_2024`, not an
    // unrelated `applogs_archive`.
    if (index.toLowerCase().startsWith(lower)) {
      out.push(index);
      if (out.length === MAX_CANDIDATES) {
        break;
      }
    }
  }
  return out;
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

  const candidateIndices = nearbyCandidates(pattern, visibleIndices);
  const diagnostic: Diagnostic = {
    ruleId: config.id,
    severity: config.severity,
    message: config.message,
    range: source.range,
    docUrl: config.docUrl,
    // The hover card renders the pattern, the index count, and the candidates.
    hoverFacts: {
      pattern,
      totalIndices: visibleIndices.length,
      ...(candidateIndices.length > 0 ? { candidateIndices } : {}),
    },
  };

  return [diagnostic];
};
