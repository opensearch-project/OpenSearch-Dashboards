/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';

export interface MarkerFix {
  title: string;
  text: string;
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface MarkerKeyParts {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

interface FixRegistryState {
  byModel: WeakMap<monaco.editor.ITextModel, Map<string, MarkerFix>>;
  syntaxByModel: WeakMap<monaco.editor.ITextModel, Map<string, MarkerFix>>;
}

// Shared via globalThis so duplicate bundles see one table.
const FIX_REGISTRY_KEY = '__osdPPLLintFixRegistry';

function getState(): FixRegistryState {
  const globalScope = globalThis as typeof globalThis & {
    [FIX_REGISTRY_KEY]?: FixRegistryState;
  };

  if (!globalScope[FIX_REGISTRY_KEY]) {
    globalScope[FIX_REGISTRY_KEY] = { byModel: new WeakMap(), syntaxByModel: new WeakMap() };
  }

  return globalScope[FIX_REGISTRY_KEY]!;
}

/**
 * Key from fields that survive Monaco's MarkerService rebuild (position + message).
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

export function setModelFixes(
  model: monaco.editor.ITextModel,
  fixes: Map<string, MarkerFix>
): void {
  if (fixes.size === 0) {
    getState().byModel.delete(model);
    return;
  }
  getState().byModel.set(model, fixes);
}

export function getModelFix(model: monaco.editor.ITextModel, key: string): MarkerFix | undefined {
  return getState().byModel.get(model)?.get(key);
}

export function clearModelFixes(model: monaco.editor.ITextModel): void {
  getState().byModel.delete(model);
}

export function setModelSyntaxFixes(
  model: monaco.editor.ITextModel,
  fixes: Map<string, MarkerFix>
): void {
  if (fixes.size === 0) {
    getState().syntaxByModel.delete(model);
    return;
  }
  getState().syntaxByModel.set(model, fixes);
}

export function getModelSyntaxFix(
  model: monaco.editor.ITextModel,
  key: string
): MarkerFix | undefined {
  return getState().syntaxByModel.get(model)?.get(key);
}

export function clearModelSyntaxFixes(model: monaco.editor.ITextModel): void {
  getState().syntaxByModel.delete(model);
}
