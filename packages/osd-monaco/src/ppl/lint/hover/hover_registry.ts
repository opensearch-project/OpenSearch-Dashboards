/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import type { HoverFacts } from '../hover_facts';

export type { HoverFacts } from '../hover_facts';

interface MarkerKeyParts {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

/**
 * Key from fields that survive Monaco's MarkerService rebuild (position + message).
 * Lives here (not in a fix registry) because the hover-facts side table is the
 * only remaining keyed-by-marker store.
 */
export function markerFixKey(marker: MarkerKeyParts): string {
  return [
    marker.startLineNumber,
    marker.startColumn,
    marker.endLineNumber,
    marker.endColumn,
    marker.message,
  ].join(':');
}

interface HoverRegistryState {
  byModel: WeakMap<monaco.editor.ITextModel, Map<string, HoverFacts>>;
}

// Shared via globalThis so duplicate bundles see one table.
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
