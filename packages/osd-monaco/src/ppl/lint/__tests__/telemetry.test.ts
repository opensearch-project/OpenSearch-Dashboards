/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  clearPPLLintTelemetry,
  clearPPLLintTelemetryLayer,
  emitPPLLintTelemetry,
  PPL_LINT_QUICKFIX_COMMAND_ID,
  PPL_LINT_TELEMETRY_EVENTS,
  PPLLintTelemetryEvent,
  reconcilePPLLintExplainTelemetry,
  reconcilePPLLintStaticTelemetry,
  registerPPLLintTelemetry,
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

  describe('active finding lifecycle', () => {
    it('keeps an unchanged finding deduped across accepted passes', () => {
      const model = {};
      const events: PPLLintTelemetryEvent[] = [];
      registerPPLLintTelemetry((event) => events.push(event));
      const findings = [{ ruleId: 'rule-a', markerKey: 'k1' }];

      reconcilePPLLintStaticTelemetry(model, findings);
      expect(shouldEmitHoverShown(model, 'k1')).toBe(true);
      expect(shouldEmitHoverShown(model, 'k1')).toBe(false);
      reconcilePPLLintStaticTelemetry(model, findings);
      expect(shouldEmitHoverShown(model, 'k1')).toBe(false);
      expect(events).toEqual([
        { name: PPL_LINT_TELEMETRY_EVENTS.DIAGNOSTIC_SHOWN, data: { rule: 'rule-a' } },
      ]);
    });

    it('treats a changed range or message fingerprint as a new interaction, not a new rule episode', () => {
      const model = {};
      const events: PPLLintTelemetryEvent[] = [];
      registerPPLLintTelemetry((event) => events.push(event));

      reconcilePPLLintStaticTelemetry(model, [
        { ruleId: 'rule-a', markerKey: 'range-1:message-1' },
      ]);
      expect(shouldEmitHoverShown(model, 'range-1:message-1')).toBe(true);
      reconcilePPLLintStaticTelemetry(model, [
        { ruleId: 'rule-a', markerKey: 'range-2:message-1' },
      ]);
      expect(shouldEmitHoverShown(model, 'range-2:message-1')).toBe(true);
      reconcilePPLLintStaticTelemetry(model, [
        { ruleId: 'rule-a', markerKey: 'range-2:message-2' },
      ]);
      expect(shouldEmitQuickfixOffered(model, 'range-2:message-2')).toBe(true);

      expect(events).toHaveLength(1);
    });

    it('emits for a newly active rule and re-arms a removed rule when it returns', () => {
      const model = {};
      const events: PPLLintTelemetryEvent[] = [];
      registerPPLLintTelemetry((event) => events.push(event));

      reconcilePPLLintStaticTelemetry(model, [{ ruleId: 'rule-a', markerKey: 'a' }]);
      reconcilePPLLintStaticTelemetry(model, [
        { ruleId: 'rule-a', markerKey: 'a' },
        { ruleId: 'rule-b', markerKey: 'b' },
      ]);
      reconcilePPLLintStaticTelemetry(model, [{ ruleId: 'rule-b', markerKey: 'b' }]);
      reconcilePPLLintStaticTelemetry(model, [
        { ruleId: 'rule-a', markerKey: 'a' },
        { ruleId: 'rule-b', markerKey: 'b' },
      ]);

      expect(events.map((event) => event.data.rule)).toEqual(['rule-a', 'rule-b', 'rule-a']);
    });

    it('tracks hover and quick-fix flags independently', () => {
      const model = {};
      reconcilePPLLintStaticTelemetry(model, [{ ruleId: 'rule-a', markerKey: 'k1' }]);
      expect(shouldEmitHoverShown(model, 'k1')).toBe(true);
      expect(shouldEmitQuickfixOffered(model, 'k1')).toBe(true);
      expect(shouldEmitHoverShown(model, 'k1')).toBe(false);
      expect(shouldEmitQuickfixOffered(model, 'k1')).toBe(false);
    });

    it('keeps state independent per model and clears it explicitly', () => {
      const a = {};
      const b = {};
      reconcilePPLLintStaticTelemetry(a, [{ ruleId: 'rule-a', markerKey: 'k1' }]);
      reconcilePPLLintStaticTelemetry(b, [{ ruleId: 'rule-a', markerKey: 'k1' }]);
      expect(shouldEmitHoverShown(a, 'k1')).toBe(true);
      expect(shouldEmitHoverShown(b, 'k1')).toBe(true);
      clearPPLLintTelemetry(a);
      expect(shouldEmitHoverShown(a, 'k1')).toBe(false);
    });

    it('reconciles explain markers without emitting diagnostic_shown', () => {
      const model = {};
      const events: PPLLintTelemetryEvent[] = [];
      registerPPLLintTelemetry((event) => events.push(event));

      reconcilePPLLintExplainTelemetry(model, ['explain-1']);
      expect(shouldEmitHoverShown(model, 'explain-1')).toBe(true);
      reconcilePPLLintExplainTelemetry(model, ['explain-1']);
      expect(shouldEmitHoverShown(model, 'explain-1')).toBe(false);
      reconcilePPLLintExplainTelemetry(model, []);
      reconcilePPLLintExplainTelemetry(model, ['explain-1']);
      expect(shouldEmitHoverShown(model, 'explain-1')).toBe(true);
      expect(events).toHaveLength(0);
    });

    it('clears one layer without disturbing the other', () => {
      const model = {};
      reconcilePPLLintStaticTelemetry(model, [{ ruleId: 'rule-a', markerKey: 'static-1' }]);
      reconcilePPLLintExplainTelemetry(model, ['explain-1']);
      expect(shouldEmitHoverShown(model, 'static-1')).toBe(true);
      expect(shouldEmitHoverShown(model, 'explain-1')).toBe(true);

      clearPPLLintTelemetryLayer(model, 'explain');
      expect(shouldEmitHoverShown(model, 'explain-1')).toBe(false);
      expect(shouldEmitQuickfixOffered(model, 'static-1')).toBe(true);
    });

    it('does not emit interactions for a marker that was never reconciled as active', () => {
      const model = {};
      expect(shouldEmitHoverShown(model, 'unknown')).toBe(false);
      expect(shouldEmitQuickfixOffered(model, 'unknown')).toBe(false);
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
