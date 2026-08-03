/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Per-instance facts a detector extracts about a finding, surfaced in the hover card. */
export interface HoverFacts {
  field?: string;
  esType?: string;
  root?: string;
  literal?: string;
  aggName?: string;
  suggestion?: string;
  pattern?: string;
  candidateIndices?: string[];
  totalIndices?: number;
  /** The disabled join keyword detected (e.g. `cross`) for disabled-join-type. */
  joinType?: string;
  /** The unsupported window function name for unsupported-window-function-in-eventstats. */
  windowFunction?: string;
  /** Wildcard counts for replace-wildcard-asymmetry. */
  patternWildcards?: number;
  replacementWildcards?: number;
  /**
   * Which pushdown-relevant pipeline clause a perf finding is about, for the
   * explain-backed rules (operation-not-pushed / operation-pushed-as-script).
   * Lets the hover card name the clause rather than only the rule.
   */
  operation?: 'filter' | 'aggregation' | 'sort';
}
