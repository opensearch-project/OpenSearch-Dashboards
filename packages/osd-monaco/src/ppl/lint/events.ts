/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Optional lint-event sink contract.
 *
 * This is a neutral, no-op-by-default extension point. The static, explain,
 * deterministic-fix, and AI paths can emit through it without importing a
 * telemetry implementation, and no event fires unless a host registers a sink.
 *
 * Payloads carry only stable rule/action identifiers and coarse status — never
 * query text, field names, index names, diagnostic messages, or replacement
 * text. Keeping that rule in the type (no free-form string payload) means a
 * later emitter cannot accidentally leak user data through this channel.
 */

/** What kind of lint interaction occurred. */
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

/** Which lint layer produced the event. */
export type PPLLintLayer = 'static' | 'explain' | 'fix' | 'ai';

export interface PPLLintEvent {
  type: PPLLintEventType;
  /** Stable catalog rule id (e.g. `field-validation`). Never a field or value. */
  ruleId: string;
  layer: PPLLintLayer;
  /** Stable action identifier for fix/AI events (e.g. `deterministic`, `olly`). */
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

/**
 * Register the process-wide lint-event sink. Returns a disposer that only clears
 * the sink if it is still the one this call installed, so an out-of-order
 * teardown cannot drop a newer sink.
 */
export function registerPPLLintEventSink(sink?: PPLLintEventSink): () => void {
  const state = getEventState();
  state.sink = sink;
  return () => {
    if (state.sink === sink) {
      state.sink = undefined;
    }
  };
}

/**
 * Emit a lint event through the registered sink, if any. Best-effort: with no
 * sink it is a no-op, and a throwing sink is swallowed so telemetry can never
 * affect linting.
 */
export function emitPPLLintEvent(event: PPLLintEvent): void {
  const { sink } = getEventState();
  if (!sink) {
    return;
  }
  try {
    sink(event);
  } catch {
    // A failing sink must never disrupt linting.
  }
}
