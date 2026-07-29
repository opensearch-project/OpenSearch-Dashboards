/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPPLLintBridge, setPPLLintEnabled } from '@osd/monaco';
import { lintRuntimePPLQuery } from '../../../data/public';

/**
 * Enables the PPL lint engine, and registers the runtime-grammar bridge when
 * that surface is available too.
 *
 * Always returns a disposer, even when no bridge was registered: the engine flag
 * lives on `globalThis` and outlives the plugin, so a caller that only got a
 * disposer in the bridge case had no way to turn lint back off on teardown.
 */
export function registerPplLint(enabled: boolean, runtimeGrammarEnabled: boolean): () => void {
  setPPLLintEnabled(enabled);

  const unregisterBridge =
    enabled && runtimeGrammarEnabled ? registerPPLLintBridge(lintRuntimePPLQuery) : undefined;

  return () => {
    unregisterBridge?.();
    setPPLLintEnabled(false);
  };
}
