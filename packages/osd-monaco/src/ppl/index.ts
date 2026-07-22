/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This import registers the PPL monaco language contribution
 */
import './language';
export { revalidatePPLModel, setupPPLTokenization } from './language';
import { ID } from './constants';
export {
  clearPPLValidationContext,
  registerPPLValidationProvider,
  resolvePPLValidationResult,
  setPPLValidationContext,
} from './validation_provider';
export type {
  PPLValidationContext,
  PPLValidationProvider,
  PPLValidationProviderRequest,
} from './validation_provider';
export type { PPLValidationResult } from './ppl_language_analyzer';

export {
  clearPPLLintContext,
  getPPLLintContext,
  isPPLLintEnabled,
  registerPPLLintBridge,
  resolvePPLLintResult,
  setPPLLintContext,
  setPPLLintEnabled,
} from './lint_bridge';
export type {
  PPLLintContext,
  PPLLintBridge,
  PPLLintBridgeRequest,
  PPLLintHttpClient,
} from './lint_bridge';
export type { Diagnostic, DiagnosticRange, LintResult, LintSeverity } from './lint/diagnostic';
export type { BundleRuleOverrides, CatalogEntry, LintRunContext } from './lint/types';
export { runLint } from './lint/lint_runner';
export { getBundledCatalog } from './lint/catalog';
export { createRuntimeRuleNameToIndex } from './lint/rule_index';
export { runExplainLint, hasExplainRules } from './lint/explain/run_explain_lint';
export { explainCache, toExplainPlan } from './lint/explain/explain_cache';
export type { ExplainResolution, ExplainResolveOptions } from './lint/explain/explain_cache';
export type {
  ExplainPlan,
  ExplainRelNode,
  ExplainRelTree,
  ExplainDetector,
  ExplainLintContext,
} from './lint/explain/explain_types';
// Explain range-narrowing + attribution. The resolver, snapshot builder, and
// probe orchestration are driven from this package's language layer; the types
// are exported so hosts and tests can read the same contract.
export { resolveExplainRanges } from './lint/explain/resolve_explain_ranges';
export { buildExplainAttributionSnapshot } from './lint/explain/attribution/candidates';
export { validateExplainAttributionSnapshot } from './lint/explain/attribution/snapshot';
export type {
  CompiledPPLLintAnalysis,
  ExplainAttributionSnapshot,
  ExplainAttributionCandidateSnapshot,
} from './lint/explain/attribution/snapshot';

export { buildCommandSuggestion } from './command_suggestion';
export type { CommandSuggestion } from './command_suggestion';

export const PPLLang = { ID };
