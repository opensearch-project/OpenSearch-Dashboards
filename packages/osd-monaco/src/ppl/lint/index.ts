/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Monaco-free entry point for the PPL lint engine.
 *
 * Consumed via the `@osd/monaco/ppl-lint` subpath (a redirect-stub directory,
 * same idiom as `@osd/i18n/react`). This barrel re-exports only the engine
 * surface, which depends solely on `antlr4ng`, `@osd/antlr-grammar`, and
 * `semver` — it never touches `monaco-editor`. It deliberately does NOT
 * re-export `lint_bridge`, `diagnostic_to_marker`, or the hover provider/
 * registry, all of which are Monaco-bound.
 *
 * This lets the data plugin's runtime-grammar fallback (`runtime_lint.ts`)
 * import the engine without pulling in the Monaco-laden `@osd/monaco` barrel
 * (which is `jest.mock()`'d in tests) and without reaching into `target/`.
 */

export { runLint } from './lint_runner';
export { getBundledCatalog } from './catalog';
export { createRuntimeRuleNameToIndex } from './rule_index';
export { PIPE_FIRST_PREFIX, remapPipeFirstColumns } from './range_utils';
export type { Diagnostic, DiagnosticRange, LintResult, LintSeverity } from './diagnostic';
export type { BundleRuleOverrides, CatalogEntry, LintRunContext } from './types';
