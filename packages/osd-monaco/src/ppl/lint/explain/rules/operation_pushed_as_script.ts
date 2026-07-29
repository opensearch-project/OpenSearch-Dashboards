/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../../diagnostic';
import { wholeQueryRange } from '../../range_utils';
import { detectExplainOutcomes } from '../explain_outcomes';
import { ExplainDetector, ExplainOutcome } from '../explain_types';

/**
 * A "pushed as script" signal: an operation that WAS pushed into OpenSearch, but
 * via a Painless script — per-document evaluation instead of a native query or
 * sort.
 */
interface ScriptSignal {
  outcome: Extract<ExplainOutcome, 'filter:script' | 'sort:script'>;
  /**
   * Which pipeline clause this signal is about. Rides the diagnostic as
   * `hoverFacts.operation` and `explainTarget.operation` so the hover card can
   * name the clause and the range resolver can find the offending command.
   */
  operation: 'filter' | 'sort';
  /**
   * Context-specific message. Leads with the user-visible consequence and names
   * the operation; the engine-internal "why" (per-document script) lives in the
   * hover card's Engine-behavior line, not the inline squiggle.
   */
  message: string;
}

// Both the push tag AND the discriminator must be present. The discriminator
// alone is not enough: a pushed composite aggregation can carry a script-based
// group key (`opensearch_compounded_script` inside the bucket source) without
// any `SCRIPT->`/`SORT_EXPR->` tag — requiring the tag prevents a false positive
// on that pushed-aggregation case (design §6.10 finding 3).
const SIGNALS: ScriptSignal[] = [
  {
    outcome: 'filter:script',
    operation: 'filter',
    message:
      'This filter may be slow because it does extra calculations. Compare the field directly instead.',
  },
  {
    outcome: 'sort:script',
    operation: 'sort',
    message:
      'This sort may be slow because it does extra calculations. Sort by an existing field instead.',
  },
];

/**
 * Flags operations pushed into OpenSearch as Painless scripts. Mutually
 * exclusive with `operation-not-pushed` for any given operation signal: either
 * the operation was not pushed (that rule) or it was pushed expensively (this
 * rule), never both.
 */
export const operationPushedAsScriptDetector: ExplainDetector = (plan, config, context) => {
  if (!plan.isCalcite) {
    return [];
  }
  const outcomes = new Set(detectExplainOutcomes(plan).map(({ outcome }) => outcome));
  const diagnostics: Diagnostic[] = [];
  for (const signal of SIGNALS) {
    if (outcomes.has(signal.outcome)) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: signal.message,
        // Whole-query range by default; the tree-aware resolver in the runtime
        // layer narrows this to the offending command via `explainTarget` when a
        // parse tree is available (design §6).
        range: wholeQueryRange(context.query),
        docUrl: config.docUrl,
        hoverFacts: { operation: signal.operation },
        explainTarget: { operation: signal.operation, outcome: signal.outcome, fields: [] },
      });
    }
  }
  return diagnostics;
};
