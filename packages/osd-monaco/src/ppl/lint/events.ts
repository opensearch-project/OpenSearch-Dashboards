/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** No-op-by-default sink; payloads carry only stable ids, never user data. */
export type PPLLintEventType =
  | 'diagnostic-shown'
  | 'hover-shown'
  | 'fix-offered'
  | 'fix-applied'
  | 'ai-offered'
  | 'ai-requested'
  | 'ai-applied'
  | 'ai-rejected'
  | 'ai-cancelled'
  | 'ai-failed';

export type PPLLintLayer = 'static' | 'explain' | 'fix' | 'ai';

export interface PPLLintEvent {
  type: PPLLintEventType;
  ruleId: string;
  layer: PPLLintLayer;
  action?: string;
}

export type PPLLintEventSink = (event: PPLLintEvent) => void;

interface PPLLintEventState {
  sink: PPLLintEventSink | undefined;
}

const PPL_LINT_EVENT_STATE_KEY = '__osdPPLLintEventState';

function getEventState(): PPLLintEventState {
  const globalScope = globalThis as typeof globalThis & {
    [PPL_LINT_EVENT_STATE_KEY]?: PPLLintEventState;
  };
  if (!globalScope[PPL_LINT_EVENT_STATE_KEY]) {
    globalScope[PPL_LINT_EVENT_STATE_KEY] = { sink: undefined };
  }
  return globalScope[PPL_LINT_EVENT_STATE_KEY]!;
}

// Disposer only clears the sink if still the one installed, so out-of-order teardown can't drop a newer sink.
export function registerPPLLintEventSink(sink?: PPLLintEventSink): () => void {
  const state = getEventState();
  state.sink = sink;
  return () => {
    if (state.sink === sink) {
      state.sink = undefined;
    }
  };
}

export function emitPPLLintEvent(event: PPLLintEvent): void {
  const { sink } = getEventState();
  if (!sink) {
    return;
  }
  try {
    sink(event);
  } catch {
    // Telemetry must never disrupt linting.
  }
}
