/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPPLLintBridge, setPPLLintEnabled } from '@osd/monaco';
import { lintRuntimePPLQuery } from '../../../data/public';

/** Registers the PPL lint bridge when both lint and runtime grammar are enabled. */
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
