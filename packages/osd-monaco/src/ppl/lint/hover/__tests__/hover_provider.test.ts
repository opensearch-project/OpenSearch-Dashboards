/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../../monaco';
import { LINT_MARKER_SOURCE, ruleIdOf } from '../../diagnostic_to_marker';
import { markerFixKey, setModelFixes, clearModelFixes, MarkerFix } from '../../fix_registry';
import { pplLintHoverProvider, LINT_OWNER } from '../hover_provider';
import { registerPPLDiagnosticActionContributor } from '../../diagnostic_action';
import {
  PPLLintTelemetryEvent,
  PPL_LINT_TELEMETRY_EVENTS,
  clearPPLLintTelemetry,
  reconcilePPLLintStaticTelemetry,
  registerPPLLintTelemetry,
} from '../../telemetry';

type Marker = monaco.editor.IMarker;

const model = {
  uri: monaco.Uri.parse('inmemory://model/q.ppl'),
} as unknown as monaco.editor.ITextModel;

function makeMarker(overrides: Partial<Marker> = {}): Marker {
  return {
    owner: LINT_OWNER,
    resource: model.uri,
    severity: monaco.MarkerSeverity.Warning,
    message: 'msg',
    startLineNumber: 1,
    startColumn: 5,
    endLineNumber: 1,
    endColumn: 12,
    source: LINT_MARKER_SOURCE,
    code: { value: 'division-by-zero', target: monaco.Uri.parse('https://docs.example/x') },
    ...overrides,
  } as unknown as Marker;
}

// Returns test markers for the lint owner; [] for others.
let markersByOwner: Record<string, Marker[]> = {};
beforeEach(() => {
  markersByOwner = {};
  jest
    .spyOn(monaco.editor, 'getModelMarkers')
    .mockImplementation((filter: { owner?: string }) => markersByOwner[filter.owner ?? ''] ?? []);
});
afterEach(() => {
  jest.restoreAllMocks();
  clearModelFixes(model);
});

function hoverAt(line: number, column: number) {
  return pplLintHoverProvider.provideHover!(
    model,
    new monaco.Position(line, column),
    { isCancellationRequested: false } as unknown as monaco.CancellationToken,
    undefined
  ) as monaco.languages.Hover | null;
}

function markdownOf(hover: monaco.languages.Hover | null): string {
  if (!hover) return '';
  const first = hover.contents[0] as monaco.IMarkdownString;
  return first.value;
}

function activateMarkers(markers: Marker[]): void {
  reconcilePPLLintStaticTelemetry(
    model,
    markers.map((marker) => ({
      ruleId: ruleIdOf(marker) ?? '',
      markerKey: markerFixKey(marker),
    }))
  );
}

describe('pplLintHoverProvider', () => {
  it('returns a card for a lint marker under the cursor', () => {
    markersByOwner[LINT_OWNER] = [makeMarker({ message: 'Dividing by zero returns null.' })];
    const hover = hoverAt(1, 7);
    expect(hover).not.toBeNull();
    // The rule id is secondary metadata on the severity line, not the headline.
    expect(markdownOf(hover)).toContain('⚠️ **Warning**');
    expect(markdownOf(hover)).toContain('Rule: `division-by-zero`');
    expect(markdownOf(hover)).toContain('Dividing by zero returns null.');
    expect(markdownOf(hover)).toContain('**Fix** — Use the intended divisor');
    expect(markdownOf(hover)).not.toContain('**Engine behavior**');
    expect(markdownOf(hover)).not.toContain('· Warning');
  });

  it('returns null when the cursor is outside every marker range', () => {
    markersByOwner[LINT_OWNER] = [makeMarker({ startColumn: 5, endColumn: 8 })];
    expect(hoverAt(1, 20)).toBeNull();
  });

  it('returns null when there are no lint markers at all', () => {
    expect(hoverAt(1, 7)).toBeNull();
  });

  it('ignores markers whose source is not ppl-lint', () => {
    markersByOwner[LINT_OWNER] = [makeMarker({ source: 'owner.syntax' })];
    expect(hoverAt(1, 7)).toBeNull();
  });

  it('renders the quick-fix preview from the side table', () => {
    const marker = makeMarker({
      code: { value: 'field-validation', target: monaco.Uri.parse('https://docs.example/f') },
      message: 'Unknown field "reveneu". Did you mean "revenue"?',
    });
    markersByOwner[LINT_OWNER] = [marker];
    const fix: MarkerFix = { title: 'Replace with "revenue"', text: 'revenue' };
    setModelFixes(model, new Map([[markerFixKey(marker), fix]]));

    const md = markdownOf(hoverAt(1, 7));
    expect(md).toContain('**Quick fix available** — `revenue`');
    expect(md).not.toContain('Closest known field');
  });

  it('picks the innermost marker when several overlap', () => {
    const outer = makeMarker({
      startColumn: 1,
      endColumn: 30,
      code: { value: 'agg-on-text', target: monaco.Uri.parse('https://docs.example/a') },
      message: 'outer',
    });
    const inner = makeMarker({
      startColumn: 5,
      endColumn: 12,
      code: { value: 'division-by-zero', target: monaco.Uri.parse('https://docs.example/d') },
      message: 'inner',
    });
    markersByOwner[LINT_OWNER] = [outer, inner];
    const md = markdownOf(hoverAt(1, 7));
    // The innermost marker's message wins.
    expect(md).toContain('inner');
    expect(md).not.toContain('outer');
  });

  it('still renders when code (ruleId) is absent', () => {
    const marker = makeMarker({ code: undefined, message: 'no code here' });
    markersByOwner[LINT_OWNER] = [marker];
    const md = markdownOf(hoverAt(1, 7));
    expect(md).toContain('no code here');
    // No catalog entry → no Fix line, but never throws / never blank.
    expect(md).not.toContain('**Fix**');
    expect(md).not.toContain('Rule:');
    expect(md).not.toContain('**Engine behavior**');
  });

  it('renders a plain-string marker code as the rule id', () => {
    markersByOwner[LINT_OWNER] = [makeMarker({ code: 'agg-on-text' })];
    expect(markdownOf(hoverAt(1, 7))).toContain('Rule: `agg-on-text`');
  });

  describe('contributed actions', () => {
    it('appends contributed actions as a separate trusted command-link block', () => {
      const dispose = registerPPLDiagnosticActionContributor((c) => [
        { title: 'Ask Olly to fix', commandId: 'ppl.aiFix', args: [c.ruleId] },
      ]);
      try {
        markersByOwner[LINT_OWNER] = [makeMarker()];
        const hover = hoverAt(1, 7);
        expect(hover).not.toBeNull();
        // Main card stays untrusted; the action block is a second, trusted part.
        expect((hover!.contents[0] as monaco.IMarkdownString).isTrusted).toBe(false);
        const actionPart = hover!.contents[1] as monaco.IMarkdownString;
        expect(actionPart.isTrusted).toBe(true);
        expect(actionPart.value).toContain('Ask Olly to fix');
        expect(actionPart.value).toContain('command:ppl.aiFix');
      } finally {
        dispose();
      }
    });

    it('adds no extra content part when nothing is contributed', () => {
      markersByOwner[LINT_OWNER] = [makeMarker()];
      const hover = hoverAt(1, 7);
      expect(hover!.contents).toHaveLength(1);
    });

    it('escapes a contributor title so it cannot inject markdown into the trusted block', () => {
      // A title that tries to close the link early and open its own command link.
      const dispose = registerPPLDiagnosticActionContributor(() => [
        { title: '](command:evil?[]) [x', commandId: 'ppl.aiFix' },
      ]);
      try {
        markersByOwner[LINT_OWNER] = [makeMarker()];
        const actionPart = hoverAt(1, 7)!.contents[1] as monaco.IMarkdownString;
        expect(actionPart.isTrusted).toBe(true);
        // The declared link is the only real one. The injected `evil` text
        // survives only as escaped, inert link text: no link-forming `](command:`
        // sequence points at it, so markdown never renders it as a command link.
        expect(actionPart.value).toContain('](command:ppl.aiFix');
        expect(actionPart.value).not.toContain('](command:evil');
      } finally {
        dispose();
      }
    });

    it('drops an action whose commandId is not a plain identifier', () => {
      const dispose = registerPPLDiagnosticActionContributor(() => [
        { title: 'sneaky', commandId: 'ppl.aiFix?evil=1) [x](command:evil' },
      ]);
      try {
        markersByOwner[LINT_OWNER] = [makeMarker()];
        const hover = hoverAt(1, 7);
        // The sole action was rejected, so no trusted action block is added.
        expect(hover!.contents).toHaveLength(1);
      } finally {
        dispose();
      }
    });
  });

  describe('telemetry', () => {
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

    it('emits hover_shown with the rule id when a card is returned', () => {
      markersByOwner[LINT_OWNER] = [makeMarker()];
      activateMarkers(markersByOwner[LINT_OWNER]);
      events = [];
      hoverAt(1, 7);
      expect(events).toEqual([
        { name: PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN, data: { rule: 'division-by-zero' } },
      ]);
    });

    it('does not emit when no lint marker is under the cursor', () => {
      markersByOwner[LINT_OWNER] = [makeMarker({ startColumn: 5, endColumn: 8 })];
      activateMarkers(markersByOwner[LINT_OWNER]);
      events = [];
      hoverAt(1, 20);
      expect(events).toHaveLength(0);
    });

    it('emits hover_shown with an undefined rule when the marker has no code', () => {
      markersByOwner[LINT_OWNER] = [makeMarker({ code: undefined })];
      activateMarkers(markersByOwner[LINT_OWNER]);
      events = [];
      hoverAt(1, 7);
      expect(events).toEqual([
        { name: PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN, data: { rule: undefined } },
      ]);
    });

    it('deduplicates repeated hovers over the same marker within a pass', () => {
      markersByOwner[LINT_OWNER] = [makeMarker()];
      activateMarkers(markersByOwner[LINT_OWNER]);
      events = [];
      // Monaco re-invokes provideHover per hover anchor (character position);
      // three hovers over the same marker must count as one.
      hoverAt(1, 6);
      hoverAt(1, 7);
      hoverAt(1, 8);
      expect(events).toHaveLength(1);
    });

    it('does not count an unchanged marker again on a new accepted pass', () => {
      markersByOwner[LINT_OWNER] = [makeMarker()];
      activateMarkers(markersByOwner[LINT_OWNER]);
      events = [];
      hoverAt(1, 7);
      activateMarkers(markersByOwner[LINT_OWNER]);
      hoverAt(1, 7);
      expect(events).toHaveLength(1);
    });

    it('counts the hover again after the marker disappears and returns', () => {
      markersByOwner[LINT_OWNER] = [makeMarker()];
      activateMarkers(markersByOwner[LINT_OWNER]);
      events = [];
      hoverAt(1, 7);
      activateMarkers([]);
      activateMarkers(markersByOwner[LINT_OWNER]);
      hoverAt(1, 7);
      expect(
        events.filter((event) => event.name === PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN)
      ).toHaveLength(2);
    });
  });
});
