/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../monaco';
import type { PPLValidationContext } from './validation_provider';
import type { LintResult } from './lint/diagnostic';
import type { BundleRuleOverrides, LintPayloadContext, LintRunContext } from './lint/types';

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
 *
 * `injectedWhereCount` reports how many `where` commands the preparer folded in
 * (dashboard filters, time range). When it is non-zero the explained plan can
 * contain filter operations with no counterpart in the editor text, so the
 * attribution layer must not pin a filter outcome on the user's only `where`
 * without a probe — the injected one may be the culprit.
 */
export type PrepareExplainQuery = (raw: string) => {
  query: string;
  cacheKey: string;
  injectedWhereCount?: number;
};

export interface PPLLintContext extends PPLValidationContext, LintPayloadContext {
  http?: PPLLintHttpClient;
  prepareExplainQuery?: PrepareExplainQuery;
  /**
   * The active dataset's title, forwarded with chat-based lint-fix requests so
   * the chat message can name the dataset. Set from `dataset.title` by the host.
   */
  datasetTitle?: string;
  /**
   * The global `enableAIFeatures` uiSetting. When false the AI quick-fix action
   * is hidden entirely, matching every other Query-Assist surface.
   */
  enableAIFeatures?: boolean;
  /**
   * Whether the AI lint-fix agent is actually reachable for the SELECTED data
   * source. `enableAIFeatures` and the chat opener are deployment-global, but the
   * fix executes against the selected cluster's ML Commons agent — so a cluster
   * without that agent must not offer the action. `false` hides the AI quick-fix;
   * `undefined` (probe not yet resolved, or host that does not probe) leaves it
   * shown, so this can only ever suppress a button, never reveal one the other
   * checks would hide. Resolved asynchronously by the host per data source.
   */
  aiAgentAvailableForSource?: boolean;
  /**
   * Host-supplied opener for the AI chat-based lint fix flow. The leaf package
   * cannot import core/chat, so it builds a plain request payload and lets the
   * host open chat plus register the apply tool.
   */
  onAskAiFix?: (request: AskPPLLintFixRequest) => void;
  /**
   * Assistant action name the host registered for applying a PPL lint fix.
   * Hosts may use distinct names because assistant actions are globally keyed.
   */
  aiFixToolName?: string;
}

/** Plain-data request the Monaco command sends to a host chat opener. */
export interface AskPPLLintFixRequest {
  requestId: string;
  sourceQueryHash: string;
  toolName: string;
  modelUri: string;
  query: string;
  diagnostic: {
    message: string;
    ruleId?: string;
    operation?: 'filter' | 'aggregation' | 'sort';
    outcome?: string;
    targetText?: string;
    targetRange?: { startOffset: number; endOffset: number };
    relatedTexts?: string[];
    fixInstructions?: string;
  };
  datasetTitle?: string;
  dataSourceId?: string;
  /** Short, human-facing chat bubble shown to the user (rule + offending query). */
  chatMessage: string;
  /**
   * Out-of-band context for the model: correlation ids + tool-calling
   * instructions. The host pushes this into the assistant context store so the
   * model receives it while the chat UI renders nothing for it. Keeps the
   * machine plumbing out of the visible transcript.
   */
  chatContext?: string;
  lintContext?: LintRunContext;
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
