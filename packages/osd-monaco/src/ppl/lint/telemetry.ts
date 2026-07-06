/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PPL lint feature-usage telemetry.
 *
 * The lint engine (marker pass, hover card, quick-fix code actions) lives in
 * `@osd/monaco`, which cannot depend on OpenSearch Dashboards core and so cannot
 * call `core.telemetry.getPluginRecorder()` directly. Instead the host (the
 * `query_enhancements` plugin) injects a sink via {@link registerPPLLintTelemetry}
 * during its `start()`, and the engine emits structured, telemetry-API-agnostic
 * events through {@link emitPPLLintTelemetry}. This mirrors the sink-injection
 * pattern used by `lint_bridge.ts`.
 *
 * The engine knows nothing about `recordEvent`/OTel; the plugin-side callback is
 * the only place that touches the core telemetry API.
 */

/**
 * Lint feature-usage event names. They follow the `<domain>_<verb>` snake_case
 * convention shared with the PPL query emitter, and the downstream dashboards key
 * off the exact strings — treat them as a stable contract, not a display label.
 */
export const PPL_LINT_TELEMETRY_EVENTS = {
  /** A lint marker was produced for the model (deduped per rule per pass). */
  DIAGNOSTIC_SHOWN: 'ppl_lint_diagnostic_shown',
  /** The hover card rendered for a lint marker under the cursor. */
  HOVER_SHOWN: 'ppl_lint_hover_shown',
  /** The code-action provider offered a lint quick-fix. */
  QUICKFIX_OFFERED: 'ppl_lint_quickfix_offered',
  /** A lint quick-fix was invoked (its edit applied). */
  QUICKFIX_CLICKED: 'ppl_lint_quickfix_clicked',
} as const;

/**
 * Id of the Monaco command dispatched when a lint quick-fix is invoked, so the
 * engine can record a `quickfix_clicked` event. Monaco applies a code action's
 * `edit` before running its `command`, so attaching this to the quick-fix keeps
 * the fix behavior intact and adds a reliable "clicked" signal.
 */
export const PPL_LINT_QUICKFIX_COMMAND_ID = 'ppl.lint.quickfixApplied';

/**
 * A telemetry event the engine emits. Deliberately telemetry-API-agnostic: a
 * name plus a structured `data` object. `data` is always an object (never
 * omitted) because core's `TelemetryEvent.data` is required; `rule` carries the
 * lint rule id where one exists.
 */
export interface PPLLintTelemetryEvent {
  name: string;
  data: { rule?: string };
}

type PPLLintTelemetrySink = (event: PPLLintTelemetryEvent) => void;

interface PPLLintTelemetryState {
  sink: PPLLintTelemetrySink | undefined;
}

// Use globalThis so multiple bundled Monaco/language modules share one sink,
// matching the `lint_bridge.ts` global-state precedent.
const PPL_LINT_TELEMETRY_STATE_KEY = '__osdPPLLintTelemetryState';

function getTelemetryState(): PPLLintTelemetryState {
  const globalScope = globalThis as typeof globalThis & {
    [PPL_LINT_TELEMETRY_STATE_KEY]?: PPLLintTelemetryState;
  };

  if (!globalScope[PPL_LINT_TELEMETRY_STATE_KEY]) {
    globalScope[PPL_LINT_TELEMETRY_STATE_KEY] = { sink: undefined };
  }

  return globalScope[PPL_LINT_TELEMETRY_STATE_KEY]!;
}

/**
 * Register the host's telemetry sink. The `query_enhancements` plugin calls this
 * from its `start()` with a callback that forwards to
 * `core.telemetry.getPluginRecorder().recordEvent(...)`. When no sink is
 * registered (or the host passes none), {@link emitPPLLintTelemetry} is a no-op.
 *
 * @returns a disposer that clears the sink (only if it is still the current one).
 */
export function registerPPLLintTelemetry(sink?: PPLLintTelemetrySink): () => void {
  const state = getTelemetryState();
  state.sink = sink;
  return () => {
    if (state.sink === sink) {
      state.sink = undefined;
    }
  };
}

/**
 * Emit a lint feature-usage event through the host sink. Best-effort: no-ops when
 * no sink is registered, and swallows sink errors so telemetry never disrupts the
 * editor.
 */
export function emitPPLLintTelemetry(event: PPLLintTelemetryEvent): void {
  const { sink } = getTelemetryState();
  if (!sink) {
    return;
  }
  try {
    sink(event);
  } catch {
    // Telemetry is best-effort; never surface a sink failure to the editor.
  }
}

/**
 * Per-model, per-lint-pass dedup so `hover_shown` / `quickfix_offered` count
 * distinct user-facing occurrences rather than Monaco's repeated provider
 * invocations. Monaco re-invokes `provideHover` for every hover anchor (a single
 * character position) and auto-triggers `provideCodeActions` on every cursor move
 * over a marker, so emitting on each call would count mouse travel instead of
 * hovers/offers. This mirrors how `diagnostic_shown` counts once per rule per
 * pass: within one lint pass (a stable set of markers), each distinct marker's
 * hover/offer counts once; editing the query starts a new pass, which resets the
 * state and re-arms counting. Keyed by the model object via WeakMap so disposed
 * models are collected automatically; typed as `object` to keep the engine free
 * of a core/monaco type dependency here.
 */
interface PPLLintTelemetryDedup {
  /** Marker keys already counted as "hover shown" in the current lint pass. */
  hoveredKeys: Set<string>;
  /** Marker keys already counted as "quick-fix offered" in the current pass. */
  offeredKeys: Set<string>;
}

const dedupByModel = new WeakMap<object, PPLLintTelemetryDedup>();

function getDedup(model: object): PPLLintTelemetryDedup {
  let dedup = dedupByModel.get(model);
  if (!dedup) {
    dedup = { hoveredKeys: new Set<string>(), offeredKeys: new Set<string>() };
    dedupByModel.set(model, dedup);
  }
  return dedup;
}

/**
 * True the first time a hover card for `markerKey` is shown in the current lint
 * pass, collapsing Monaco's per-anchor re-invocation storm into one event per
 * distinct marker. A new lint pass resets the state so hovering the same finding
 * after an edit counts again.
 */
export function shouldEmitHoverShown(model: object, markerKey: string): boolean {
  const { hoveredKeys } = getDedup(model);
  if (hoveredKeys.has(markerKey)) {
    return false;
  }
  hoveredKeys.add(markerKey);
  return true;
}

/**
 * True the first time a quick-fix for `markerKey` is offered in the current lint
 * pass; repeat `provideCodeActions` calls for the same marker (Monaco auto-fires
 * these on every cursor move) are deduped until the next pass resets the state.
 */
export function shouldEmitQuickfixOffered(model: object, markerKey: string): boolean {
  const { offeredKeys } = getDedup(model);
  if (offeredKeys.has(markerKey)) {
    return false;
  }
  offeredKeys.add(markerKey);
  return true;
}

/**
 * Reset a model's dedup state. Called by the lint lifecycle when a new pass
 * applies markers (a fresh opportunity, so the next hover/offer counts again)
 * and when a model is disposed or leaves PPL.
 */
export function resetPPLLintTelemetryDedup(model: object): void {
  dedupByModel.delete(model);
}
