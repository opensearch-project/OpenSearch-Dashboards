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

export type PPLValidationProvider =
  | ((
      request: PPLValidationProviderRequest
    ) => Promise<PPLValidationResult | null> | PPLValidationResult | null)
  | undefined;

let pplValidationProvider: PPLValidationProvider;
let pplValidationContexts = new WeakMap<monaco.editor.IModel, PPLValidationContext>();

export function registerPPLValidationProvider(provider?: PPLValidationProvider): () => void {
  pplValidationProvider = provider;
  return () => {
    if (pplValidationProvider === provider) {
      pplValidationProvider = undefined;
    }
  };
}

export function setPPLValidationContext(
  model: monaco.editor.IModel,
  context: PPLValidationContext
): void {
  pplValidationContexts.set(model, context);
}

export function clearPPLValidationContext(model: monaco.editor.IModel): void {
  pplValidationContexts.delete(model);
}

export async function resolvePPLValidationResult(
  model: monaco.editor.IModel,
  content: string,
  fallbackValidate: (content: string) => Promise<PPLValidationResult>
): Promise<PPLValidationResult> {
  if (pplValidationProvider) {
    try {
      const runtimeResult = await pplValidationProvider({
        content,
        model,
        context: pplValidationContexts.get(model),
      });
      if (runtimeResult) {
        return runtimeResult;
      }
    } catch {
      // Fall through to compiled validation on runtime-provider failures.
    }
  }

  return fallbackValidate(content);
}

export function __resetPPLValidationProviderForTests(): void {
  pplValidationProvider = undefined;
  pplValidationContexts = new WeakMap<monaco.editor.IModel, PPLValidationContext>();
}
