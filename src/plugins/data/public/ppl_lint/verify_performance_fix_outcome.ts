/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLLintContext } from '@osd/monaco';
import { hasExplainOutcome } from '@osd/monaco/target/ppl/lint/explain/explain_outcomes';
import type {
  ExplainOperation,
  ExplainOutcome,
} from '@osd/monaco/target/ppl/lint/explain/explain_types';
// Deep import into the built output rather than the '@osd/monaco' barrel, same
// as the explain_outcomes import above: the barrel pulls in monaco-editor
// browser ESM and is globally jest.mock()'d, so its value exports are
// unavailable under Jest. This is the SAME cache instance the lint pass uses,
// so probe results are shared with (and partitioned from) baseline plans.
import { explainCache } from '@osd/monaco/target/ppl/lint/explain/explain_cache';
import { buildPerformanceFixProbeQueries } from './performance_fix_revalidation';

const PERFORMANCE_OUTCOMES = new Set<ExplainOutcome>([
  'filter:script',
  'filter:coordinator',
  'aggregation:coordinator',
  'sort:script',
  'sort:coordinator',
]);

export interface PerformanceFixDiagnostic {
  operation?: ExplainOperation;
  outcome?: string;
  targetText?: string;
  targetRange?: { startOffset: number; endOffset: number };
}

/**
 * Reproduce the attributed outcome in an isolated original treatment and
 * require the proposed treatment to clear it before an editor applies the fix.
 */
export async function verifyPerformanceFixOutcome(
  originalQuery: string,
  fixedQuery: string,
  diagnostic: PerformanceFixDiagnostic,
  lintContext: PPLLintContext,
  isCurrent: () => boolean
): Promise<boolean> {
  const outcomeText = diagnostic.outcome;
  if (!outcomeText || !PERFORMANCE_OUTCOMES.has(outcomeText as ExplainOutcome)) {
    return true;
  }
  const http = lintContext.http;
  if (!http) {
    return false;
  }
  const probes = await buildPerformanceFixProbeQueries(
    originalQuery,
    fixedQuery,
    diagnostic,
    lintContext,
    isCurrent
  );
  if (!probes || !isCurrent()) {
    return false;
  }

  const outcome = outcomeText as ExplainOutcome;
  // Prepare both treatments the same way the baseline was prepared (source
  // prepend + injected filters) so their plans are comparable to the baseline's
  // and to each other; key the cache on the time-stripped variant, exactly like
  // the baseline and the attribution probes. Without this, a source-less query
  // (the default authoring form in Explore) explains to a non-`ok` result and
  // every candidate falsely reports performance-not-cleared. Mirrors
  // ExplainAttribution.explainProbe (explain_attribution.ts).
  const prepare =
    lintContext.prepareExplainQuery ?? ((raw: string) => ({ query: raw, cacheKey: raw }));
  const preparedOriginal = prepare(probes.originalTreatment);
  const preparedFixed = prepare(probes.fixedTreatment);
  const [original, fixed] = await Promise.all([
    explainCache.resolveResult(http, preparedOriginal.query, lintContext.dataSourceId, {
      partition: 'probe',
      cacheKey: preparedOriginal.cacheKey,
    }),
    explainCache.resolveResult(http, preparedFixed.query, lintContext.dataSourceId, {
      partition: 'probe',
      cacheKey: preparedFixed.cacheKey,
    }),
  ]);
  return (
    isCurrent() &&
    original.status === 'ok' &&
    fixed.status === 'ok' &&
    hasExplainOutcome(original.plan, outcome) &&
    !hasExplainOutcome(fixed.plan, outcome)
  );
}
