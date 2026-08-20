/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PPLLintTelemetryEvent,
  registerPPLLintBridge,
  registerPPLLintTelemetry,
  setPPLLintEnabled,
} from '@osd/monaco';
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
  telemetrySink?: (event: PPLLintTelemetryEvent) => void;
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
 * disposer tears down the bridge, preparer, and telemetry sink and disables the
 * engine.
 *
 * When a `telemetrySink` is supplied and lint is enabled, feature-usage events
 * (diagnostic shown, hover shown, quick-fix offered/clicked) are forwarded to it.
 * Telemetry is registered whenever lint is enabled, not only when the runtime
 * grammar is available, because the compiled-worker fallback still produces those
 * interactions.
 */
export function registerPplLint(
  enabled: boolean,
  runtimeGrammarEnabled: boolean,
  services: RegisterPplLintServices
): () => void {
  setPPLLintEnabled(enabled);

  const unregisterTelemetry =
    enabled && services.telemetrySink
      ? registerPPLLintTelemetry(services.telemetrySink)
      : undefined;

  const bridgeActive = enabled && runtimeGrammarEnabled;
  const unregisterBridge = bridgeActive ? registerPPLLintBridge(lintRuntimePPLQuery) : undefined;
  const unregisterPreparer = bridgeActive
    ? explainQueryPreparer.register(createExplainQueryPreparer(services))
    : undefined;

  return () => {
    unregisterTelemetry?.();
    unregisterBridge?.();
    unregisterPreparer?.();
    setPPLLintEnabled(false);
  };
}
