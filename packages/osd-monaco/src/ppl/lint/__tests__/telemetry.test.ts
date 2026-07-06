/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  emitPPLLintTelemetry,
  PPL_LINT_QUICKFIX_COMMAND_ID,
  PPL_LINT_TELEMETRY_EVENTS,
  PPLLintTelemetryEvent,
  registerPPLLintTelemetry,
  resetPPLLintTelemetryDedup,
  shouldEmitHoverShown,
  shouldEmitQuickfixOffered,
} from '../telemetry';

describe('PPL lint telemetry', () => {
  // Each test registers its own sink; clear the global sink afterwards so tests
  // do not leak into one another.
  afterEach(() => {
    registerPPLLintTelemetry(undefined);
  });

  it('no-ops when no sink is registered', () => {
    // Ensure nothing is registered, then emit — must not throw.
    registerPPLLintTelemetry(undefined);
    expect(() =>
      emitPPLLintTelemetry({ name: PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN, data: {} })
    ).not.toThrow();
  });

  it('forwards emitted events to the registered sink', () => {
    const events: PPLLintTelemetryEvent[] = [];
    registerPPLLintTelemetry((event) => events.push(event));

    emitPPLLintTelemetry({
      name: PPL_LINT_TELEMETRY_EVENTS.DIAGNOSTIC_SHOWN,
      data: { rule: 'division-by-zero' },
    });

    expect(events).toEqual([
      { name: 'ppl_lint_diagnostic_shown', data: { rule: 'division-by-zero' } },
    ]);
  });

  it('stops forwarding after the disposer runs', () => {
    const sink = jest.fn();
    const dispose = registerPPLLintTelemetry(sink);
    dispose();

    emitPPLLintTelemetry({ name: PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN, data: {} });
    expect(sink).not.toHaveBeenCalled();
  });

  it('a later registration replaces an earlier one', () => {
    const first = jest.fn();
    const second = jest.fn();
    registerPPLLintTelemetry(first);
    registerPPLLintTelemetry(second);

    emitPPLLintTelemetry({ name: PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN, data: {} });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("a stale disposer does not clear the current sink (only clears if it's still current)", () => {
    const first = jest.fn();
    const disposeFirst = registerPPLLintTelemetry(first);
    const second = jest.fn();
    registerPPLLintTelemetry(second);

    // The first sink's disposer must not wipe the second (current) sink.
    disposeFirst();
    emitPPLLintTelemetry({ name: PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN, data: {} });
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('swallows sink errors so telemetry never disrupts the editor', () => {
    registerPPLLintTelemetry(() => {
      throw new Error('sink blew up');
    });
    expect(() =>
      emitPPLLintTelemetry({ name: PPL_LINT_TELEMETRY_EVENTS.QUICKFIX_OFFERED, data: {} })
    ).not.toThrow();
  });

  describe('per-pass dedup', () => {
    it('shouldEmitHoverShown returns true once per marker key, then false until reset', () => {
      const model = {};
      expect(shouldEmitHoverShown(model, 'k1')).toBe(true);
      expect(shouldEmitHoverShown(model, 'k1')).toBe(false);
      // A different marker still counts.
      expect(shouldEmitHoverShown(model, 'k2')).toBe(true);
      // A new pass (reset) re-arms counting for the same key.
      resetPPLLintTelemetryDedup(model);
      expect(shouldEmitHoverShown(model, 'k1')).toBe(true);
    });

    it('shouldEmitQuickfixOffered returns true once per marker key, then false until reset', () => {
      const model = {};
      expect(shouldEmitQuickfixOffered(model, 'k1')).toBe(true);
      expect(shouldEmitQuickfixOffered(model, 'k1')).toBe(false);
      resetPPLLintTelemetryDedup(model);
      expect(shouldEmitQuickfixOffered(model, 'k1')).toBe(true);
    });

    it('tracks hover and quick-fix dedup independently', () => {
      const model = {};
      expect(shouldEmitHoverShown(model, 'k1')).toBe(true);
      // Offering a quick-fix for the same key is a separate counter.
      expect(shouldEmitQuickfixOffered(model, 'k1')).toBe(true);
    });

    it('keeps dedup state independent per model', () => {
      const a = {};
      const b = {};
      expect(shouldEmitHoverShown(a, 'k1')).toBe(true);
      // A different model has its own state.
      expect(shouldEmitHoverShown(b, 'k1')).toBe(true);
    });
  });

  it('exposes the stable event-name and command-id contract', () => {
    // The downstream dashboards key off these literals; a change here is a
    // breaking contract change, so pin them.
    expect(PPL_LINT_TELEMETRY_EVENTS).toEqual({
      DIAGNOSTIC_SHOWN: 'ppl_lint_diagnostic_shown',
      HOVER_SHOWN: 'ppl_lint_hover_shown',
      QUICKFIX_OFFERED: 'ppl_lint_quickfix_offered',
      QUICKFIX_CLICKED: 'ppl_lint_quickfix_clicked',
    });
    expect(PPL_LINT_QUICKFIX_COMMAND_ID).toBe('ppl.lint.quickfixApplied');
  });
});
