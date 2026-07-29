/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPPLLintBridge, setPPLLintEnabled } from '@osd/monaco';
import {
  DataPublicPluginStart,
  explainQueryPreparer,
  lintRuntimePPLQuery,
} from '../../../data/public';
import { IUiSettingsClient } from '../../../../core/public';
import { createExplainQueryPreparer } from './explain_query_preparer';

interface RegisterPplLintServices {
  data: DataPublicPluginStart;
  uiSettings: IUiSettingsClient;
  getAppId: () => string | undefined;
}

/**
 * Enables the PPL lint engine; when the runtime-grammar surface is available too,
 * registers the runtime-grammar bridge and the explain-query preparer (which
 * reproduces the query the search interceptor runs, so the explain-backed rules
 * plan what executes).
 *
 * Always returns a disposer, even when no bridge was registered: the engine flag
 * lives on `globalThis` and outlives the plugin, so a caller that only got a
 * disposer in the bridge case had no way to turn lint back off on teardown. The
 * disposer tears down the bridge and preparer and disables the engine.
 */
export function registerPplLint(
  enabled: boolean,
  runtimeGrammarEnabled: boolean,
  services: RegisterPplLintServices
): () => void {
  setPPLLintEnabled(enabled);

  const bridgeActive = enabled && runtimeGrammarEnabled;
  const unregisterBridge = bridgeActive ? registerPPLLintBridge(lintRuntimePPLQuery) : undefined;
  const unregisterPreparer = bridgeActive
    ? explainQueryPreparer.register(createExplainQueryPreparer(services))
    : undefined;

  return () => {
    unregisterBridge?.();
    unregisterPreparer?.();
    setPPLLintEnabled(false);
  };
}
