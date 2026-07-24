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

// Neutral lint extension points (inert until a feature registers into them).
export { registerPPLLintEventSink, emitPPLLintEvent } from './lint/events';
export type { PPLLintEvent, PPLLintEventSink, PPLLintEventType, PPLLintLayer } from './lint/events';
export {
  registerPPLDiagnosticActionContributor,
  collectPPLDiagnosticActions,
} from './lint/diagnostic_action';
export type {
  DiagnosticAction,
  DiagnosticActionContext,
  PPLDiagnosticActionContributor,
} from './lint/diagnostic_action';
export {
  classifyTopLevelSource,
  isPipeFirstQuery,
  sourceConflictsWithDataset,
} from './lint/top_level_source';
export type { TopLevelSource } from './lint/top_level_source';

export { buildCommandSuggestion } from './command_suggestion';
export type { CommandSuggestion } from './command_suggestion';

export const PPLLang = { ID };
