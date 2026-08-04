/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../../diagnostic';
import { wholeQueryRange } from '../../range_utils';
import { detectExplainOutcomes } from '../explain_outcomes';
import { ExplainDetector, ExplainOutcome } from '../explain_types';

/**
 * A "not pushed" signal: a residual marker that, when present in the physical
 * plan *without* any of its push tags, means the operation fell back to the
 * coordinator after a full fetch.
 */
interface NotPushedSignal {
  outcome: Extract<
    ExplainOutcome,
    'filter:coordinator' | 'aggregation:coordinator' | 'sort:coordinator'
  >;
  /**
   * Which pipeline clause this signal is about. Rides the diagnostic as
   * `hoverFacts.operation` and `explainTarget.operation` so the hover card can
   * name the clause and the range resolver can find the offending command.
   */
  operation: 'filter' | 'aggregation' | 'sort';
  /**
   * Context-specific message. Leads with the user-visible consequence and names
   * the operation; the engine-internal "why" (coordinator fallback) lives in the
   * hover card's Engine-behavior line, not the inline squiggle.
   */
  message: string;
}

// Match on operator presence/absence, never on expression formatting — the
// `PushDownContext.toString()` shape is not a stable API (see design §8). The
// `$condition=` filter signal uses a bare substring match rather than a regex
// because the condition node can wrap nested parens (e.g. `$condition=[$t5]`
// where `$t5` is `CAST($t2):DOUBLE NOT NULL`), which truncates a `[^)]*` regex.
const SIGNALS: NotPushedSignal[] = [
  {
    outcome: 'filter:coordinator',
    operation: 'filter',
    message:
      'This filter may be slow because it does extra work. Use a simpler filter when possible.',
  },
  {
    outcome: 'aggregation:coordinator',
    operation: 'aggregation',
    message:
      'This aggregation may be slow on large amounts of data. Use a simpler calculation when possible.',
  },
  {
    outcome: 'sort:coordinator',
    operation: 'sort',
    message: 'This sort may be slow. Sort by an existing field when possible.',
  },
];

/**
 * Flags operations the optimizer left running in the coordinator. Adding
 * coverage for a future operation type (e.g. a join) means appending one entry
 * to {@link SIGNALS} — no new rule, no new catalog entry.
 */
export const operationNotPushedDetector: ExplainDetector = (plan, config, context) => {
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
