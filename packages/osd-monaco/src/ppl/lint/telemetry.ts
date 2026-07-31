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
  /** A static-lint rule transitioned from absent to active in the model. */
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
 * Static findings carry both identities telemetry needs: the rule episode for
 * diagnostic exposure and the exact marker fingerprint for interactions.
 */
export interface PPLLintStaticFinding {
  ruleId: string;
  markerKey: string;
}

export type PPLLintTelemetryLayer = 'static' | 'explain';

interface MarkerTelemetryState {
  hovered: boolean;
  offered: boolean;
}

interface ModelTelemetryState {
  activeStaticRules: Set<string>;
  staticMarkers: Map<string, MarkerTelemetryState>;
  explainMarkers: Map<string, MarkerTelemetryState>;
}

// State contains active findings only and is keyed weakly so abandoned models
// remain collectible. Static and explain marker layers are separate because the
// async explain render replaces Monaco's initial static marker set; an unchanged
// static marker must keep its interaction flags through that replacement.
const telemetryByModel = new WeakMap<object, ModelTelemetryState>();

function getModelState(model: object): ModelTelemetryState {
  let state = telemetryByModel.get(model);
  if (!state) {
    state = {
      activeStaticRules: new Set<string>(),
      staticMarkers: new Map<string, MarkerTelemetryState>(),
      explainMarkers: new Map<string, MarkerTelemetryState>(),
    };
    telemetryByModel.set(model, state);
  }
  return state;
}

function reconcileMarkers(
  previous: Map<string, MarkerTelemetryState>,
  activeKeys: Iterable<string>
): Map<string, MarkerTelemetryState> {
  const next = new Map<string, MarkerTelemetryState>();
  for (const key of activeKeys) {
    next.set(key, previous.get(key) ?? { hovered: false, offered: false });
  }
  return next;
}

/**
 * Reconcile an accepted static lint result. `diagnostic_shown` fires only when a
 * rule enters the active set; unchanged rules survive typing passes, while a
 * rule removed by an accepted pass is re-armed if it later returns.
 */
export function reconcilePPLLintStaticTelemetry(
  model: object,
  findings: readonly PPLLintStaticFinding[]
): void {
  const state = getModelState(model);
  const nextRules = new Set<string>();
  const newlyActiveRules: string[] = [];

  for (const finding of findings) {
    if (!nextRules.has(finding.ruleId) && !state.activeStaticRules.has(finding.ruleId)) {
      newlyActiveRules.push(finding.ruleId);
    }
    nextRules.add(finding.ruleId);
  }

  state.activeStaticRules = nextRules;
  state.staticMarkers = reconcileMarkers(
    state.staticMarkers,
    findings.map((finding) => finding.markerKey)
  );

  for (const rule of newlyActiveRules) {
    emitPPLLintTelemetry({
      name: PPL_LINT_TELEMETRY_EVENTS.DIAGNOSTIC_SHOWN,
      data: { rule },
    });
  }
}

/** Reconcile exact marker fingerprints produced by the async explain layer. */
export function reconcilePPLLintExplainTelemetry(
  model: object,
  markerKeys: readonly string[]
): void {
  const state = getModelState(model);
  state.explainMarkers = reconcileMarkers(state.explainMarkers, markerKeys);
}

/** Clear one marker layer when the current generation definitively removed it. */
export function clearPPLLintTelemetryLayer(model: object, layer: PPLLintTelemetryLayer): void {
  const state = telemetryByModel.get(model);
  if (!state) {
    return;
  }
  if (layer === 'static') {
    state.activeStaticRules.clear();
    state.staticMarkers.clear();
  } else {
    state.explainMarkers.clear();
  }
}

/** Clear all telemetry lifecycle state for a disposed or non-PPL model. */
export function clearPPLLintTelemetry(model: object): void {
  telemetryByModel.delete(model);
}

function findActiveMarker(model: object, markerKey: string): MarkerTelemetryState | undefined {
  const state = telemetryByModel.get(model);
  return state?.staticMarkers.get(markerKey) ?? state?.explainMarkers.get(markerKey);
}

/**
 * True once for an exact active marker fingerprint. Repeated provider calls and
 * unchanged lint passes remain deduped; removal followed by return re-arms it.
 */
export function shouldEmitHoverShown(model: object, markerKey: string): boolean {
  const marker = findActiveMarker(model, markerKey);
  if (!marker || marker.hovered) {
    return false;
  }
  marker.hovered = true;
  return true;
}

/** Same lifecycle semantics as hover, tracked independently for quick-fix offers. */
export function shouldEmitQuickfixOffered(model: object, markerKey: string): boolean {
  const marker = findActiveMarker(model, markerKey);
  if (!marker || marker.offered) {
    return false;
  }
  marker.offered = true;
  return true;
}
