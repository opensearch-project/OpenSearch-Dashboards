/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';

// A quick-fix payload in Monaco coordinates, ready for the code-action provider
// to turn into a workspace edit. Mirrors the `fix` shape attached to markers by
// diagnosticToMarker, but lives in a side table rather than on the marker.
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

// Marker fields that survive Monaco's MarkerService rebuild. The key is built
// only from these because the service rebuilds markers from a fixed field list
// and drops everything else (custom `fix`/`hoverFacts` props are stripped).
interface MarkerKeyParts {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

interface FixRegistryState {
  // Lint diagnostics (owner PPL_LINT) and syntax errors (owner PPL_WORKER) are
  // produced by two independent passes, each replacing its own table wholesale.
  // Kept apart so one pass's write cannot clobber the other's fixes.
  byModel: WeakMap<monaco.editor.ITextModel, Map<string, MarkerFix>>;
  syntaxByModel: WeakMap<monaco.editor.ITextModel, Map<string, MarkerFix>>;
}

// Shared via globalThis so that, even when osd-monaco is bundled more than once,
// the writer (language.ts) and reader (code_action_provider.ts) see one table.
const FIX_REGISTRY_KEY = '__osdPPLLintFixRegistry';

function getState(): FixRegistryState {
  const globalScope = globalThis as typeof globalThis & {
    [FIX_REGISTRY_KEY]?: FixRegistryState;
  };

  if (!globalScope[FIX_REGISTRY_KEY]) {
    globalScope[FIX_REGISTRY_KEY] = { byModel: new WeakMap(), syntaxByModel: new WeakMap() };
  }

  const state = globalScope[FIX_REGISTRY_KEY]!;
  // Back-fill the syntax table on a registry created by an older bundle.
  if (!state.syntaxByModel) {
    state.syntaxByModel = new WeakMap();
  }

  return state;
}

// Stable key correlating a stored fix with a marker after the marker has
// round-tripped through Monaco's MarkerService (position + message survive).
export function markerFixKey(marker: MarkerKeyParts): string {
  return [
    marker.startLineNumber,
    marker.startColumn,
    marker.endLineNumber,
    marker.endColumn,
    marker.message,
  ].join(':');
}

// Replace the lint fix table for a model. An empty map clears the entry so
// stale fixes never outlive the markers they belong to.
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

// Replace the syntax-error fix table for a model (owner PPL_WORKER), parallel to
// setModelFixes. An empty map clears the entry.
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
