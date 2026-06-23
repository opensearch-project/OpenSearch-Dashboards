/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPPLLintBridge, setPPLLintEnabled } from '@osd/monaco';
import { lintRuntimePPLQuery } from '../../../data/public';

/**
 * Wire the PPL linter into Monaco. No-ops the engine when `enabled` is false.
 * The bridge is only registered when the runtime grammar is also enabled;
 * otherwise the worker lints against the compiled grammar.
 */
export function registerPplLint(
  enabled: boolean,
  runtimeGrammarEnabled: boolean
): (() => void) | undefined {
  setPPLLintEnabled(enabled);
  if (enabled && runtimeGrammarEnabled) {
    return registerPPLLintBridge(lintRuntimePPLQuery);
  }
  return undefined;
}
