/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import type { HoverFacts } from '../hover_facts';

export type { HoverFacts } from '../hover_facts';

// markerFixKey now lives in fix_registry (its canonical home, shared by the
// quick-fix code-action provider). Re-exported here so existing hover importers
// keep their import path. See lint/fix_registry.ts.
export { markerFixKey } from '../fix_registry';

interface HoverRegistryState {
  byModel: WeakMap<monaco.editor.ITextModel, Map<string, HoverFacts>>;
}

const HOVER_REGISTRY_KEY = '__osdPPLLintHoverRegistry';

function getState(): HoverRegistryState {
  const globalScope = globalThis as typeof globalThis & {
    [HOVER_REGISTRY_KEY]?: HoverRegistryState;
  };

  if (!globalScope[HOVER_REGISTRY_KEY]) {
    globalScope[HOVER_REGISTRY_KEY] = { byModel: new WeakMap() };
  }

  return globalScope[HOVER_REGISTRY_KEY]!;
}

export function setModelHoverFacts(
  model: monaco.editor.ITextModel,
  facts: Map<string, HoverFacts>
): void {
  if (facts.size === 0) {
    getState().byModel.delete(model);
    return;
  }
  getState().byModel.set(model, facts);
}

export function getModelHoverFacts(
  model: monaco.editor.ITextModel,
  key: string
): HoverFacts | undefined {
  return getState().byModel.get(model)?.get(key);
}

export function clearModelHoverFacts(model: monaco.editor.ITextModel): void {
  getState().byModel.delete(model);
}
