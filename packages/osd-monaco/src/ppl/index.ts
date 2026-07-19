/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This import registers the PPL monaco language contribution
 */
import './language';
export { revalidatePPLModel } from './language';
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
export type { ExplainResolution } from './lint/explain/explain_cache';
export type {
  ExplainPlan,
  ExplainRelNode,
  ExplainRelTree,
  ExplainDetector,
  ExplainLintContext,
} from './lint/explain/explain_types';

export { buildCommandSuggestion } from './command_suggestion';
export type { CommandSuggestion } from './command_suggestion';

export const PPLLang = { ID };
