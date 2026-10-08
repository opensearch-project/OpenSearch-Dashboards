/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import type { ExplainOperation, ExplainOutcome } from '../explain/explain_types';

/**
 * What rides the marker for the AI tier: the detector's per-instance policy plus,
 * for the explain-backed rules, the attributed operation/outcome the host
 * re-verifies against `_explain` before applying a candidate fix.
 *
 * A superset of `DiagnosticAiFix` rather than a loosening of it — `eligible` stays
 * required for detectors, but is optional here because an explain diagnostic
 * carries attribution without any detector-supplied policy. Absence of `eligible`
 * means the generic rule applies: offer AI when there is no deterministic fix.
 */
export interface AiFixMarkerMetadata {
  eligible?: boolean;
  instructions?: string;
  operation?: ExplainOperation;
  outcome?: ExplainOutcome;
}

interface AiFixRegistryState {
  byModel: WeakMap<monaco.editor.ITextModel, Map<string, AiFixMarkerMetadata>>;
}

const AI_FIX_REGISTRY_KEY = '__osdPPLLintAiFixRegistry';

function getState(): AiFixRegistryState {
  const globalScope = globalThis as typeof globalThis & {
    [AI_FIX_REGISTRY_KEY]?: AiFixRegistryState;
  };
  if (!globalScope[AI_FIX_REGISTRY_KEY]) {
    globalScope[AI_FIX_REGISTRY_KEY] = { byModel: new WeakMap() };
  }
  return globalScope[AI_FIX_REGISTRY_KEY]!;
}

export function setModelAiFixMetadata(
  model: monaco.editor.ITextModel,
  metadata: Map<string, AiFixMarkerMetadata>
): void {
  if (metadata.size === 0) {
    getState().byModel.delete(model);
    return;
  }
  getState().byModel.set(model, metadata);
}

export function getModelAiFixMetadata(
  model: monaco.editor.ITextModel,
  key: string
): AiFixMarkerMetadata | undefined {
  return getState().byModel.get(model)?.get(key);
}

export function clearModelAiFixMetadata(model: monaco.editor.ITextModel): void {
  getState().byModel.delete(model);
}
