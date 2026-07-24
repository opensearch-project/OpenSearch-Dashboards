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
      // Optional abort signal so a probe request can be cancelled once its
      // wall-clock budget expires. Core's HttpFetchOptions accepts it; a client
      // that ignores it still stays within the probe layer's timeout race.
      signal?: AbortSignal;
    }
  ) => Promise<unknown>;
}

/**
 * Turns raw editor text into the query the host would actually run, for the
 * explain-backed rules. It prepends `source = <dataset>` (so a leading-pipe
 * query explains against a real source) and folds in the dashboard + time
 * filters the search interceptor applies, so the `_explain` plan matches what
 * executes. Sync + pure snapshot of the current filter state.
 *
 * Returns both the query to explain (`query`, with the volatile time clause) and
 * the string to key the cache on (`cacheKey`, without it) so the cached plan is
 * reused across time-picker moves. Only the text sent to `_explain` is affected;
 * rendered marker ranges stay on the raw editor offsets.
 */
export type PrepareExplainQuery = (raw: string) => { query: string; cacheKey: string };

export interface PPLLintContext extends PPLValidationContext, LintPayloadContext {
  http?: PPLLintHttpClient;
  prepareExplainQuery?: PrepareExplainQuery;
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
      // Off by default: lint is gated by the queryEnhancements.pplLint capability
      // (off by default). The plugin opts in via setPPLLintEnabled(true).
      enabled: false,
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
