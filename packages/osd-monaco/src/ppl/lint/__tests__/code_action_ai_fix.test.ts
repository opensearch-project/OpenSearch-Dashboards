/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import { pplLintCodeActionProvider } from '../code_action_provider';
import {
  diagnosticToMarker,
  LINT_MARKER_SOURCE,
  SYNTAX_MARKER_SOURCE,
} from '../diagnostic_to_marker';
import { setModelFixes, clearModelFixes, markerFixKey, MarkerFix } from '../fix_registry';
import { setPPLLintContext, clearPPLLintContext } from '../../lint_bridge';
import { AI_FIX_COMMAND_ID } from '../ai_fix/ai_fix_command_id';
import {
  AiFixMarkerMetadata,
  clearModelAiFixMetadata,
  setModelAiFixMetadata,
} from '../ai_fix/ai_fix_registry';
import type { Diagnostic } from '../diagnostic';
import type { ExplainOutcome } from '../explain/explain_types';
import {
  clearPPLLintTelemetry,
  PPL_LINT_TELEMETRY_EVENTS,
  reconcilePPLLintStaticTelemetry,
  registerPPLLintTelemetry,
} from '../telemetry';
import type { PPLLintTelemetryEvent } from '../telemetry';

type LintMarker = monaco.editor.IMarkerData;

const model = {
  uri: monaco.Uri.parse('inmemory://model/ai.ppl'),
  getVersionId: () => 1,
  getValueInRange: () => 'bytes + latency',
  getOffsetAt: ({ column }: { column: number }) => column - 1,
} as unknown as monaco.editor.ITextModel;

// A marker carrying an AI-fixable ruleId on `code` (the object form with a link),
// mirroring diagnosticToMarker's output.
function aiMarker(ruleId: string, overrides: Partial<LintMarker> = {}): LintMarker {
  return {
    severity: monaco.MarkerSeverity.Warning,
    message: 'msg',
    startLineNumber: 1,
    startColumn: 5,
    endLineNumber: 1,
    endColumn: 10,
    source: LINT_MARKER_SOURCE,
    code: { value: ruleId, target: monaco.Uri.parse('https://docs') },
    ...overrides,
  } as LintMarker;
}

function provide(markers: LintMarker[]) {
  const result = pplLintCodeActionProvider.provideCodeActions(
    model,
    {} as monaco.Range,
    { markers, only: undefined, trigger: 1 } as monaco.languages.CodeActionContext,
    {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose() {} }),
    } as unknown as monaco.CancellationToken
  ) as monaco.languages.CodeActionList;
  return result.actions;
}

describe('pplLintCodeActionProvider — AI quick-fix emission', () => {
  afterEach(() => {
    clearModelFixes(model);
    clearModelAiFixMetadata(model);
    clearPPLLintContext(model);
  });

  it('emits an isAI command action for a no-fix lint marker when AI + chat opener are present', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    const actions = provide([aiMarker('type-mismatch-numeric')]);
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toContain('Ask AI to fix');
    expect((actions[0] as any).isAI).toBe(true);
    expect(actions[0].command?.id).toBe(AI_FIX_COMMAND_ID);
    expect((actions[0].command?.arguments?.[0] as any).ruleId).toBe('type-mismatch-numeric');
    // It carries a command, not an edit.
    expect(actions[0].edit).toBeUndefined();
  });

  it('offers AI for ANY no-fix lint marker, regardless of rule (no allowlist)', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    // A rule that is not in any hand-maintained set — with no deterministic fix,
    // it still gets the AI fallback under the new "offer on all" model.
    for (const ruleId of ['division-by-zero', 'flat-object-subfield', 'some-future-rule']) {
      clearModelFixes(model);
      const actions = provide([aiMarker(ruleId)]);
      expect(actions).toHaveLength(1);
      expect((actions[0] as any).isAI).toBe(true);
      expect((actions[0].command?.arguments?.[0] as any).ruleId).toBe(ruleId);
    }
  });

  it('does not emit an AI action when AI features are disabled', () => {
    setPPLLintContext(model, { enableAIFeatures: false, onAskAiFix: jest.fn() } as any);
    expect(provide([aiMarker('type-mismatch-numeric')])).toHaveLength(0);
  });

  it('does not emit an AI action when no chat opener is wired', () => {
    setPPLLintContext(model, { enableAIFeatures: true, datasetTitle: 'accounts' } as any);
    expect(provide([aiMarker('type-mismatch-numeric')])).toHaveLength(0);
  });

  it('does not emit an AI action when the agent is unavailable for the selected source', () => {
    setPPLLintContext(model, {
      enableAIFeatures: true,
      onAskAiFix: jest.fn(),
      aiAgentAvailableForSource: false,
    } as any);
    expect(provide([aiMarker('type-mismatch-numeric')])).toHaveLength(0);
  });

  it('emits an AI action when per-source availability is still unresolved (fail-open)', () => {
    // undefined = probe not yet resolved (or a host that does not probe); the
    // action stays shown so an unresolved probe never hides a working button.
    setPPLLintContext(model, {
      enableAIFeatures: true,
      onAskAiFix: jest.fn(),
      aiAgentAvailableForSource: undefined,
    } as any);
    expect(provide([aiMarker('type-mismatch-numeric')])).toHaveLength(1);
  });

  it('emits an AI action when the agent is available for the selected source', () => {
    setPPLLintContext(model, {
      enableAIFeatures: true,
      onAskAiFix: jest.fn(),
      aiAgentAvailableForSource: true,
    } as any);
    expect(provide([aiMarker('type-mismatch-numeric')])).toHaveLength(1);
  });

  it('prefers the deterministic fix and does not also emit an AI action', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    // field-validation with a near-field match ships a deterministic Levenshtein
    // fix → the AI tier is suppressed for that marker.
    const marker = aiMarker('field-validation');
    const fixes = new Map<string, MarkerFix>();
    fixes.set(markerFixKey(marker), { title: 'Replace with "revenue"', text: 'revenue' });
    setModelFixes(model, fixes);
    const actions = provide([marker]);
    // Only the deterministic quick-fix; the AI tier is suppressed when a fix exists.
    expect(actions).toHaveLength(1);
    expect((actions[0] as any).isAI).toBeFalsy();
    expect(actions[0].title).toBe('Replace with "revenue"');
  });

  it('offers AI for a field-validation marker with NO deterministic fix (no near match)', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    // No fix in the side table → the unknown field had no near candidate; the AI
    // fallback should now be offered where before it was silently absent.
    const actions = provide([aiMarker('field-validation')]);
    expect(actions).toHaveLength(1);
    expect((actions[0] as any).isAI).toBe(true);
  });

  it('offers AI for a proven-safe rex instance and carries its rewrite contract', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    const marker = aiMarker('rex-scan-cost');
    setModelAiFixMetadata(
      model,
      new Map([
        [
          markerFixKey(marker),
          {
            eligible: true,
            instructions: "Insert WHERE LIKE(body, '%logtype=%') before rex.",
          },
        ],
      ])
    );

    const [action] = provide([marker]);
    expect((action as any).isAI).toBe(true);
    expect(action.command?.arguments?.[0]).toEqual(
      expect.objectContaining({
        fixInstructions: "Insert WHERE LIKE(body, '%logtype=%') before rex.",
      })
    );
  });

  it('hides AI for an advisory-only rex instance without affecting other rules', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    const rex = aiMarker('rex-scan-cost');
    setModelAiFixMetadata(model, new Map([[markerFixKey(rex), { eligible: false }]]));

    expect(provide([rex])).toHaveLength(0);
    expect(provide([aiMarker('type-mismatch-numeric')])).toHaveLength(1);
  });

  it('passes the exact target and performance outcome to the AI command', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    const marker = aiMarker('operation-pushed-as-script');
    // The attribution now rides the AI side table, sourced from
    // `Diagnostic.explainTarget` rather than the removed hover-facts channel. The
    // assertions below are unchanged on purpose: `outcome` is read directly instead
    // of being rebuilt from the rule ID, and the expected value is identical.
    setModelAiFixMetadata(
      model,
      new Map([
        [markerFixKey(marker), { operation: 'sort' as const, outcome: 'sort:script' as const }],
      ])
    );

    const [action] = provide([marker]);
    expect(action.command?.arguments?.[0]).toEqual(
      expect.objectContaining({
        operation: 'sort',
        outcome: 'sort:script',
        targetText: 'bytes + latency',
        targetRange: { startOffset: 4, endOffset: 9 },
      })
    );
  });

  it('never emits an AI action on the syntax channel', () => {
    setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
    const syntax = aiMarker('type-mismatch-numeric', { source: SYNTAX_MARKER_SOURCE });
    expect(provide([syntax])).toHaveLength(0);
  });

  // #12464 added quickfix telemetry to answer "is anyone using PPL lint?", but its
  // emission sits after the `if (!fix) continue` guard and the AI action exists
  // only when there is no deterministic fix — so AI offers were invisible.
  describe('telemetry counts AI offers', () => {
    let events: PPLLintTelemetryEvent[];
    beforeEach(() => {
      events = [];
      clearPPLLintTelemetry(model);
      registerPPLLintTelemetry((event) => events.push(event));
    });
    afterEach(() => {
      registerPPLLintTelemetry(undefined);
      clearPPLLintTelemetry(model);
    });

    function activate(marker: LintMarker) {
      reconcilePPLLintStaticTelemetry(model, [
        {
          ruleId: typeof marker.code === 'object' ? (marker.code?.value as string) : '',
          markerKey: markerFixKey(marker),
        },
      ]);
    }

    it('emits quickfix_offered for an AI-only offer (no deterministic fix)', () => {
      setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
      const marker = aiMarker('operation-pushed-as-script');
      activate(marker);
      events = [];

      const actions = provide([marker]);
      expect(actions.some((a) => (a as { isAI?: boolean }).isAI)).toBe(true);
      expect(events).toEqual([
        {
          name: PPL_LINT_TELEMETRY_EVENTS.QUICKFIX_OFFERED,
          data: { rule: 'operation-pushed-as-script' },
        },
      ]);
    });

    it('dedupes the AI offer across repeated provider calls for the same marker', () => {
      setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
      const marker = aiMarker('operation-not-pushed');
      activate(marker);
      events = [];

      // Monaco re-triggers provideCodeActions on every cursor move; an offer is one
      // event per active marker fingerprint, not per provider call.
      provide([marker]);
      provide([marker]);
      expect(
        events.filter((e) => e.name === PPL_LINT_TELEMETRY_EVENTS.QUICKFIX_OFFERED)
      ).toHaveLength(1);
    });

    it('does not emit an offer when the AI action is suppressed', () => {
      setPPLLintContext(model, { enableAIFeatures: false } as any);
      const marker = aiMarker('operation-pushed-as-script');
      activate(marker);
      events = [];

      expect(provide([marker])).toHaveLength(0);
      expect(events).toEqual([]);
    });
  });

  // The host's `_explain` re-verification fails OPEN: `verifyPerformanceFixOutcome`
  // returns true (fix treated as verified, no probe issued) when `outcome` is
  // missing or is not one of the performance outcomes. Nothing else in the suite
  // would notice — tsc passes and the other assertions hand-seed the side table.
  // So walk the real producer chain instead: an explain diagnostic carrying
  // `explainTarget` must survive diagnosticToMarker and the extras handoff with an
  // outcome the host actually probes on.
  describe('explain attribution survives the marker round-trip (guards _explain re-verification)', () => {
    // Mirrors verify_performance_fix_outcome.ts's PERFORMANCE_OUTCOMES. An outcome
    // outside this set silently skips the control/treatment probe.
    const PERFORMANCE_OUTCOMES = [
      'filter:script',
      'filter:coordinator',
      'aggregation:coordinator',
      'sort:script',
      'sort:coordinator',
    ];

    const explainDiagnostic = (
      ruleId: string,
      operation: 'filter' | 'aggregation' | 'sort',
      outcome: ExplainOutcome
    ): Diagnostic => ({
      ruleId,
      severity: 'warning',
      message: 'msg',
      range: { startLine: 1, startColumn: 4, endLine: 1, endColumn: 9 },
      explainTarget: { operation, outcome, fields: [] },
    });

    it.each([
      ['operation-pushed-as-script', 'sort', 'sort:script'],
      ['operation-not-pushed', 'filter', 'filter:coordinator'],
    ] as Array<[string, 'filter' | 'aggregation' | 'sort', ExplainOutcome]>)(
      'delivers a probeable outcome for %s',
      (ruleId, operation, outcome) => {
        setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);

        // Produce the marker the way language.ts does, from a real Diagnostic.
        const marker = diagnosticToMarker(explainDiagnostic(ruleId, operation, outcome));

        // …then replay renderLintMarkers' extras handoff: the aiFix payload rides
        // the marker and is moved into the side table before setModelMarkers.
        const withExtras = marker as monaco.editor.IMarkerData & {
          aiFix?: AiFixMarkerMetadata;
        };
        expect(withExtras.aiFix).toEqual({ operation, outcome });
        setModelAiFixMetadata(model, new Map([[markerFixKey(marker), withExtras.aiFix!]]));
        delete withExtras.aiFix;

        const [action] = provide([marker]);
        const args = action.command?.arguments?.[0] as { operation?: string; outcome?: string };
        expect(args.operation).toBe(operation);
        expect(args.outcome).toBe(outcome);
        // The assertion that actually matters: a truthy outcome inside the probed
        // set, so the host runs the re-check rather than early-returning true.
        expect(PERFORMANCE_OUTCOMES).toContain(args.outcome);
      }
    );

    it('leaves eligible unset so an explain diagnostic still gets the generic AI offer', () => {
      setPPLLintContext(model, { enableAIFeatures: true, onAskAiFix: jest.fn() } as any);
      const marker = diagnosticToMarker(
        explainDiagnostic('operation-not-pushed', 'sort', 'sort:coordinator')
      );
      const aiFix = (marker as monaco.editor.IMarkerData & { aiFix?: AiFixMarkerMetadata }).aiFix;

      // No invented `eligible: true` — absence means "offer AI when there is no
      // deterministic fix", which is the deterministic-first rule.
      expect(aiFix).not.toHaveProperty('eligible');
      setModelAiFixMetadata(model, new Map([[markerFixKey(marker), aiFix!]]));
      expect(provide([marker]).some((a) => (a as { isAI?: boolean }).isAI)).toBe(true);
    });
  });
});
