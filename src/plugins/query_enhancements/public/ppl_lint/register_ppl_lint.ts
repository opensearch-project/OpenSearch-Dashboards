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
 * Registers the PPL lint bridge when both lint and runtime grammar are enabled,
 * and always registers the explain-query preparer (which reproduces the query the
 * search interceptor runs, so the explain-backed rules plan what executes). Returns
 * a disposer that tears both down.
 */
export function registerPplLint(
  enabled: boolean,
  runtimeGrammarEnabled: boolean,
  services: RegisterPplLintServices
): (() => void) | undefined {
  setPPLLintEnabled(enabled);
  if (!(enabled && runtimeGrammarEnabled)) {
    return undefined;
  }
  const unregisterBridge = registerPPLLintBridge(lintRuntimePPLQuery);
  const unregisterPreparer = explainQueryPreparer.register(createExplainQueryPreparer(services));
  return () => {
    unregisterBridge();
    unregisterPreparer();
  };
}
