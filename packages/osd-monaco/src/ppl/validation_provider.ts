/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../monaco';
import type { PPLValidationResult } from './ppl_language_analyzer';

export interface PPLValidationContext {
  useRuntimeGrammar: boolean;
  dataSourceId?: string;
  dataSourceVersion?: string;
}

export interface PPLValidationProviderRequest {
  content: string;
  model: monaco.editor.IModel;
  context?: PPLValidationContext;
}

export type PPLValidationProvider = (
  request: PPLValidationProviderRequest
) => Promise<PPLValidationResult | null> | PPLValidationResult | null;

interface PPLValidationGlobalState {
  provider: PPLValidationProvider | undefined;
  contexts: WeakMap<monaco.editor.IModel, PPLValidationContext>;
}

// Use globalThis so multiple bundled Monaco/language modules share one
// provider registry and one per-model context map.
const PPL_VALIDATION_GLOBAL_STATE_KEY = '__osdPPLValidationGlobalState';

function getGlobalValidationState(): PPLValidationGlobalState {
  const globalScope = globalThis as typeof globalThis & {
    [PPL_VALIDATION_GLOBAL_STATE_KEY]?: PPLValidationGlobalState;
  };

  if (!globalScope[PPL_VALIDATION_GLOBAL_STATE_KEY]) {
    globalScope[PPL_VALIDATION_GLOBAL_STATE_KEY] = {
      provider: undefined,
      contexts: new WeakMap<monaco.editor.IModel, PPLValidationContext>(),
    };
  }

  return globalScope[PPL_VALIDATION_GLOBAL_STATE_KEY]!;
}

export function registerPPLValidationProvider(provider?: PPLValidationProvider): () => void {
  const state = getGlobalValidationState();
  state.provider = provider;
  return () => {
    if (state.provider === provider) {
      state.provider = undefined;
    }
  };
}

export function setPPLValidationContext(
  model: monaco.editor.IModel,
  context: PPLValidationContext
): void {
  getGlobalValidationState().contexts.set(model, context);
}

export function clearPPLValidationContext(model: monaco.editor.IModel): void {
  getGlobalValidationState().contexts.delete(model);
}

export async function resolvePPLValidationResult(
  model: monaco.editor.IModel,
  content: string,
  fallbackValidate: (content: string) => Promise<PPLValidationResult>
): Promise<PPLValidationResult> {
  const state = getGlobalValidationState();
  if (state.provider) {
    try {
      const runtimeResult = await state.provider({
        content,
        model,
        context: state.contexts.get(model),
      });
      if (runtimeResult !== null) {
        return runtimeResult;
      }
    } catch {
      // Fall through to compiled validation on runtime-provider failures.
    }
  }

  return fallbackValidate(content);
}
