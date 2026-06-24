/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../monaco';
import type { PPLValidationContext } from './validation_provider';
import type { LintResult } from './lint/diagnostic';
import type { BundleRuleOverrides, LintPayloadContext } from './lint/types';

export interface PPLLintHttpClient {
  post: (
    path: string,
    options?: {
      body?: BodyInit | null;
      query?: Record<string, string | number | boolean | undefined>;
    }
  ) => Promise<unknown>;
}

export interface PPLLintContext extends PPLValidationContext, LintPayloadContext {
  http?: PPLLintHttpClient;
}

export interface PPLLintBridgeRequest {
  content: string;
  model: monaco.editor.IModel;
  context?: PPLLintContext;
}

export type PPLLintBridge = (
  request: PPLLintBridgeRequest
) => Promise<LintResult | null> | LintResult | null;

interface PPLLintGlobalState {
  bridge: PPLLintBridge | undefined;
  contexts: WeakMap<monaco.editor.IModel, PPLLintContext>;
  enabled: boolean;
}

const PPL_LINT_GLOBAL_STATE_KEY = '__osdPPLLintGlobalState';

function getGlobalLintState(): PPLLintGlobalState {
  const globalScope = globalThis as typeof globalThis & {
    [PPL_LINT_GLOBAL_STATE_KEY]?: PPLLintGlobalState;
  };

  if (!globalScope[PPL_LINT_GLOBAL_STATE_KEY]) {
    globalScope[PPL_LINT_GLOBAL_STATE_KEY] = {
      bridge: undefined,
      contexts: new WeakMap<monaco.editor.IModel, PPLLintContext>(),
      enabled: true,
    };
  }

  return globalScope[PPL_LINT_GLOBAL_STATE_KEY]!;
}

export function setPPLLintEnabled(enabled: boolean): void {
  getGlobalLintState().enabled = enabled;
}

export function isPPLLintEnabled(): boolean {
  return getGlobalLintState().enabled;
}

export function registerPPLLintBridge(bridge?: PPLLintBridge): () => void {
  const state = getGlobalLintState();
  state.bridge = bridge;
  return () => {
    if (state.bridge === bridge) {
      state.bridge = undefined;
    }
  };
}

export function setPPLLintContext(model: monaco.editor.IModel, context: PPLLintContext): void {
  getGlobalLintState().contexts.set(model, context);
}

export function getPPLLintContext(model: monaco.editor.IModel): PPLLintContext | undefined {
  return getGlobalLintState().contexts.get(model);
}

export function clearPPLLintContext(model: monaco.editor.IModel): void {
  getGlobalLintState().contexts.delete(model);
}

export async function resolvePPLLintResult(
  model: monaco.editor.IModel,
  content: string,
  fallbackLint: (content: string) => Promise<LintResult>
): Promise<LintResult> {
  const state = getGlobalLintState();
  if (state.bridge) {
    try {
      const runtimeResult = await state.bridge({
        content,
        model,
        context: state.contexts.get(model),
      });
      if (runtimeResult != null) {
        return runtimeResult;
      }
    } catch {
      // fall through to compiled fallback
    }
  }

  return fallbackLint(content);
}
