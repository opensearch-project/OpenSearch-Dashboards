/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../../monaco';
import { LINT_MARKER_SOURCE } from '../../diagnostic_to_marker';
import {
  markerFixKey,
  setModelHoverFacts,
  clearModelHoverFacts,
  HoverFacts,
} from '../hover_registry';
import { pplLintHoverProvider, LINT_OWNER } from '../hover_provider';
import { registerPPLDiagnosticActionContributor } from '../../diagnostic_action';

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
  clearModelHoverFacts(model);
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

describe('pplLintHoverProvider', () => {
  it('returns a card for a lint marker under the cursor', () => {
    markersByOwner[LINT_OWNER] = [makeMarker()];
    const hover = hoverAt(1, 7);
    expect(hover).not.toBeNull();
    expect(markdownOf(hover)).toContain('**division-by-zero** · Warning');
    expect(markdownOf(hover)).toContain('**Engine behavior** —');
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

  it('includes per-instance facts from the side table', () => {
    const marker = makeMarker({
      code: { value: 'field-validation', target: monaco.Uri.parse('https://docs.example/f') },
      message: 'Unknown field "reveneu". Did you mean "revenue"?',
    });
    markersByOwner[LINT_OWNER] = [marker];
    const facts: HoverFacts = { field: 'reveneu', suggestion: 'revenue' };
    setModelHoverFacts(model, new Map([[markerFixKey(marker), facts]]));

    const md = markdownOf(hoverAt(1, 7));
    expect(md).toContain('Closest known field: `revenue`');
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
    expect(md).toContain('**division-by-zero**');
    expect(md).not.toContain('**agg-on-text**');
  });

  it('still renders when code (ruleId) is absent, using a fallback id', () => {
    const marker = makeMarker({ code: undefined, message: 'no code here' });
    markersByOwner[LINT_OWNER] = [marker];
    const md = markdownOf(hoverAt(1, 7));
    expect(md).toContain('no code here');
    // No static content, no doc link — but never throws / never blank.
    expect(md).not.toContain('**Engine behavior**');
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
});
