/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLLintContext } from '@osd/monaco';
import { analyzeCompiledPPLLint, validateCompiledPPLLintQueries } from '@osd/monaco';
import { buildExplainAttributionSnapshot } from '@osd/monaco/target/ppl/lint/explain/attribution/candidates';
import { buildExplainProbeSet } from '@osd/monaco/target/ppl/lint/explain/attribution/probes';
import {
  ExplainAttributionCandidateSnapshot,
  ExplainAttributionSnapshot,
  validateExplainAttributionSnapshot,
} from '@osd/monaco/target/ppl/lint/explain/attribution/snapshot';
import type { ExplainOperation } from '@osd/monaco/target/ppl/lint/explain/explain_types';
import { createRuntimeRuleNameToIndex } from '@osd/monaco/target/ppl/lint/rule_index';
// The shared, Monaco-free parse path. `runtime_lint.ts` no longer owns
// `buildRuntimeTree`: it moved to the headless module so the browser fallback and
// the cross-repo CI runner can never drift into different parse trees.
import { buildRuntimeTree } from '../antlr/opensearch_ppl/headless_ppl_lint';
import { pplGrammarCache } from '../antlr/opensearch_ppl/ppl_grammar_cache';

export interface PerformanceFixTarget {
  operation?: ExplainOperation;
  targetText?: string;
  targetRange?: { startOffset: number; endOffset: number };
}

export interface PerformanceFixProbeQueries {
  originalTreatment: string;
  fixedTreatment: string;
}

function changedOnlyWithinTarget(
  originalQuery: string,
  fixedQuery: string,
  targetRange: { startOffset: number; endOffset: number }
): boolean {
  if (
    originalQuery === fixedQuery ||
    targetRange.startOffset < 0 ||
    targetRange.endOffset < targetRange.startOffset ||
    targetRange.endOffset > originalQuery.length
  ) {
    return false;
  }

  const prefix = originalQuery.slice(0, targetRange.startOffset);
  const suffix = originalQuery.slice(targetRange.endOffset);
  return (
    fixedQuery.length >= prefix.length + suffix.length &&
    fixedQuery.startsWith(prefix) &&
    fixedQuery.endsWith(suffix)
  );
}

function matchesTarget(
  candidate: ExplainAttributionCandidateSnapshot,
  targetRange: { startOffset: number; endOffset: number }
): boolean {
  return (
    (candidate.startOffset === targetRange.startOffset &&
      candidate.endOffset === targetRange.endOffset) ||
    (candidate.aliasBinding?.definitionStartOffset === targetRange.startOffset &&
      candidate.aliasBinding.definitionEndOffset === targetRange.endOffset)
  );
}

/**
 * Build source-order-matched isolated treatments from already parser-owned
 * snapshots. Syntax validation is deliberately performed by the caller in one
 * parser-surface-specific batch.
 */
export function buildCandidateFixProbeQueries(
  originalQuery: string,
  fixedQuery: string,
  target: PerformanceFixTarget,
  originalSnapshot: ExplainAttributionSnapshot,
  fixedSnapshot: ExplainAttributionSnapshot
): PerformanceFixProbeQueries | undefined {
  const { operation, targetRange, targetText } = target;
  if (
    !operation ||
    !targetRange ||
    (targetText !== undefined &&
      originalQuery.slice(targetRange.startOffset, targetRange.endOffset) !== targetText) ||
    !changedOnlyWithinTarget(originalQuery, fixedQuery, targetRange) ||
    originalSnapshot.unsupportedOperations.includes(operation) ||
    fixedSnapshot.unsupportedOperations.includes(operation)
  ) {
    return undefined;
  }

  const originalCandidates = originalSnapshot.candidates.filter(
    (candidate) => candidate.operation === operation
  );
  const fixedCandidates = fixedSnapshot.candidates.filter(
    (candidate) => candidate.operation === operation
  );
  const targetIndexes = originalCandidates
    .map((candidate, index) => (matchesTarget(candidate, targetRange) ? index : -1))
    .filter((index) => index >= 0);
  if (
    targetIndexes.length !== 1 ||
    originalCandidates.length !== fixedCandidates.length ||
    originalCandidates.length === 0
  ) {
    return undefined;
  }

  const targetIndex = targetIndexes[0];
  const originalProbes = buildExplainProbeSet(originalQuery, originalCandidates);
  const fixedProbes = buildExplainProbeSet(fixedQuery, fixedCandidates);
  const originalTreatment = originalProbes?.buildTreatment(originalCandidates[targetIndex]);
  const fixedTreatment = fixedProbes?.buildTreatment(fixedCandidates[targetIndex]);
  return originalTreatment && fixedTreatment ? { originalTreatment, fixedTreatment } : undefined;
}

export async function buildPerformanceFixProbeQueries(
  originalQuery: string,
  fixedQuery: string,
  target: PerformanceFixTarget,
  lintContext: PPLLintContext,
  isCurrent: () => boolean = () => true
): Promise<PerformanceFixProbeQueries | undefined> {
  if (!isCurrent()) {
    return undefined;
  }

  let originalSnapshot: ExplainAttributionSnapshot | undefined;
  let fixedSnapshot: ExplainAttributionSnapshot | undefined;
  let validateQueries: (queries: string[]) => Promise<boolean[]>;

  if (lintContext.useRuntimeGrammar) {
    const grammar = pplGrammarCache.getCachedGrammar(lintContext.dataSourceId);
    if (!grammar) {
      return undefined;
    }
    const ruleNameToIndex = createRuntimeRuleNameToIndex(grammar.runtimeRuleNameToIndex);
    const buildSnapshot = (query: string): ExplainAttributionSnapshot | undefined => {
      const parse = buildRuntimeTree(query, grammar);
      return parse
        ? buildExplainAttributionSnapshot(parse.tree, ruleNameToIndex, parse.parserSource, {
            parserPrefixLength: parse.parserPrefixLength,
            typeMap: lintContext.typeMap,
          })
        : undefined;
    };
    originalSnapshot = buildSnapshot(originalQuery);
    fixedSnapshot = buildSnapshot(fixedQuery);
    validateQueries = async (queries) => queries.map((query) => !!buildRuntimeTree(query, grammar));
  } else {
    try {
      const [originalAnalysis, fixedAnalysis] = await Promise.all([
        analyzeCompiledPPLLint(originalQuery, lintContext),
        analyzeCompiledPPLLint(fixedQuery, lintContext),
      ]);
      originalSnapshot = validateExplainAttributionSnapshot(
        originalAnalysis.attribution,
        originalQuery
      );
      fixedSnapshot = validateExplainAttributionSnapshot(fixedAnalysis.attribution, fixedQuery);
    } catch {
      return undefined;
    }
    if (!isCurrent()) {
      return undefined;
    }
    validateQueries = validateCompiledPPLLintQueries;
  }

  if (!originalSnapshot || !fixedSnapshot || !isCurrent()) {
    return undefined;
  }
  const probes = buildCandidateFixProbeQueries(
    originalQuery,
    fixedQuery,
    target,
    originalSnapshot,
    fixedSnapshot
  );
  if (!probes) {
    return undefined;
  }

  try {
    const validation = await validateQueries([probes.originalTreatment, probes.fixedTreatment]);
    return isCurrent() && validation.length === 2 && validation.every((valid) => valid === true)
      ? probes
      : undefined;
  } catch {
    return undefined;
  }
}
