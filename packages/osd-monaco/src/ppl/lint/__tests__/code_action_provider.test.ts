/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import { pplLintCodeActionProvider } from '../code_action_provider';
import { LINT_MARKER_SOURCE, SYNTAX_MARKER_SOURCE } from '../diagnostic_to_marker';
import {
  clearModelFixes,
  clearModelSyntaxFixes,
  markerFixKey,
  MarkerFix,
  setModelFixes,
  setModelSyntaxFixes,
} from '../fix_registry';
import { registerPPLDiagnosticActionContributor } from '../diagnostic_action';

type LintMarker = monaco.editor.IMarkerData;

const model = {
  uri: monaco.Uri.parse('inmemory://model/q.ppl'),
  getVersionId: () => 1,
} as unknown as monaco.editor.ITextModel;

function makeMarker(overrides: Partial<LintMarker> = {}): LintMarker {
  return {
    severity: monaco.MarkerSeverity.Warning,
    message: 'msg',
    startLineNumber: 1,
    startColumn: 5,
    endLineNumber: 1,
    endColumn: 10,
    source: LINT_MARKER_SOURCE,
    ...overrides,
  };
}

// Seed the side-table registry the way the lint lifecycle does, so the provider
// can re-associate a fix with a marker after Monaco strips custom marker fields.
function seedFix(marker: LintMarker, fix: MarkerFix) {
  const fixes = new Map<string, MarkerFix>();
  fixes.set(markerFixKey(marker), fix);
  setModelFixes(model, fixes);
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

// Pull the single text edit out of a code action for assertions.
function editOf(action: monaco.languages.CodeAction) {
  const edit = (action.edit as any).edits[0];
  return {
    range: edit.textEdit.range,
    text: edit.textEdit.text,
    resource: edit.resource,
    versionId: edit.versionId,
  };
}

describe('pplLintCodeActionProvider', () => {
  afterEach(() => clearModelFixes(model));

  it('produces no action for a lint marker without a registered fix', () => {
    expect(provide([makeMarker()])).toHaveLength(0);
  });

  it('ignores non-lint markers even when a fix is registered for their key', () => {
    const foreign = makeMarker({ source: 'owner.syntax' });
    seedFix(foreign, { title: 'T', text: 'x' });
    expect(provide([foreign])).toHaveLength(0);
  });

  it('uses the marker bounds when the fix has no range', () => {
    const marker = makeMarker();
    seedFix(marker, { title: 'Replace with "foo"', text: 'foo' });
    const actions = provide([marker]);
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe('Replace with "foo"');
    expect(actions[0].kind).toBe('quickfix');
    const edit = editOf(actions[0]);
    expect(edit.text).toBe('foo');
    expect(edit.resource).toBe(model.uri);
    expect(edit.range).toEqual({
      startLineNumber: 1,
      startColumn: 5,
      endLineNumber: 1,
      endColumn: 10,
    });
  });

  it('uses the fix range when present, not the marker bounds', () => {
    const fixRange = { startLineNumber: 1, startColumn: 7, endLineNumber: 1, endColumn: 8 };
    const marker = makeMarker();
    seedFix(marker, { title: 'Delete P', text: '', range: fixRange });
    const actions = provide([marker]);
    expect(actions).toHaveLength(1);
    const edit = editOf(actions[0]);
    expect(edit.text).toBe('');
    expect(edit.range).toEqual(fixRange);
  });

  it('does NOT pin the edit to a model versionId', () => {
    // A captured versionId makes Monaco's bulk-edit service reject the edit once
    // the model has changed since the action was computed ("model changed in the
    // meantime") — which silently kills the quick-fix in the live editor, where
    // debounced re-lint/re-tokenize bump the version between compute and click.
    const marker = makeMarker();
    seedFix(marker, { title: 'Replace with "foo"', text: 'foo' });
    const actions = provide([marker]);
    expect(actions).toHaveLength(1);
    expect(editOf(actions[0]).versionId).toBeUndefined();
  });

  it('emits one action per fixable marker, skipping markers with no registered fix', () => {
    // Distinct positions so each marker has a distinct registry key.
    const a = makeMarker({ startColumn: 1, endColumn: 2 });
    const none = makeMarker({ startColumn: 3, endColumn: 4 });
    const b = makeMarker({ startColumn: 5, endColumn: 6 });
    const fixes = new Map<string, MarkerFix>();
    fixes.set(markerFixKey(a), { title: 'fix-a', text: 'a' });
    fixes.set(markerFixKey(b), { title: 'fix-b', text: 'b' });
    setModelFixes(model, fixes);
    const actions = provide([a, none, b]);
    expect(actions.map((act) => act.title)).toEqual(['fix-a', 'fix-b']);
  });

  it('distinguishes two markers at the same position by message', () => {
    const m1 = makeMarker({ message: 'first' });
    const m2 = makeMarker({ message: 'second' });
    const fixes = new Map<string, MarkerFix>();
    fixes.set(markerFixKey(m1), { title: 'fix-1', text: '1' });
    fixes.set(markerFixKey(m2), { title: 'fix-2', text: '2' });
    setModelFixes(model, fixes);
    expect(provide([m1]).map((a) => a.title)).toEqual(['fix-1']);
    expect(provide([m2]).map((a) => a.title)).toEqual(['fix-2']);
  });

  describe('contributed actions (diagnostic-action registry)', () => {
    // A marker whose `code` is a real catalog rule id, so the provider can look
    // up the entry and pass catalog metadata to contributors.
    const ruleMarker = (overrides: Partial<LintMarker> = {}): LintMarker =>
      makeMarker({ code: 'field-validation', ...overrides });

    it('offers a contributed action on a lint marker even with no deterministic fix', () => {
      const dispose = registerPPLDiagnosticActionContributor((c) => [
        { title: `AI: ${c.ruleId}`, commandId: 'ppl.aiFix', args: [c.ruleId] },
      ]);
      try {
        const actions = provide([ruleMarker()]);
        expect(actions).toHaveLength(1);
        expect(actions[0].title).toBe('AI: field-validation');
        expect(actions[0].kind).toBe('quickfix');
        expect(actions[0].command?.id).toBe('ppl.aiFix');
        expect(actions[0].command?.arguments).toEqual(['field-validation']);
      } finally {
        dispose();
      }
    });

    it('passes catalog aiFixable/needsExplain metadata to the contributor', () => {
      let seen: { aiFixable?: boolean; needsExplain?: boolean } | undefined;
      const dispose = registerPPLDiagnosticActionContributor((c) => {
        seen = { aiFixable: c.aiFixable, needsExplain: c.needsExplain };
        return [];
      });
      try {
        provide([ruleMarker()]);
        // field-validation is not aiFixable and not needsExplain in the F0 catalog.
        expect(seen).toEqual({ aiFixable: undefined, needsExplain: undefined });
      } finally {
        dispose();
      }
    });

    it('does not offer contributed actions on a non-lint (syntax) marker', () => {
      const dispose = registerPPLDiagnosticActionContributor(() => [
        { title: 'should not appear', commandId: 'x' },
      ]);
      try {
        expect(provide([makeMarker({ source: SYNTAX_MARKER_SOURCE })])).toHaveLength(0);
      } finally {
        dispose();
      }
    });

    it('emits both a deterministic fix and a contributed action for the same marker', () => {
      const dispose = registerPPLDiagnosticActionContributor(() => [
        { title: 'AI fix', commandId: 'ppl.aiFix' },
      ]);
      try {
        const marker = ruleMarker();
        seedFix(marker, { title: 'Deterministic fix', text: 'foo' });
        const titles = provide([marker]).map((a) => a.title);
        expect(titles).toContain('Deterministic fix');
        expect(titles).toContain('AI fix');
      } finally {
        dispose();
      }
    });
  });


  describe('syntax-error channel (command-typo quick-fix)', () => {
    afterEach(() => clearModelSyntaxFixes(model));

    const syntaxMarker = (overrides: Partial<LintMarker> = {}): LintMarker =>
      makeMarker({ source: SYNTAX_MARKER_SOURCE, ...overrides });

    function seedSyntaxFix(marker: LintMarker, fix: MarkerFix) {
      const fixes = new Map<string, MarkerFix>();
      fixes.set(markerFixKey(marker), fix);
      setModelSyntaxFixes(model, fixes);
    }

    it('offers a quick-fix for a syntax marker with a registered syntax fix', () => {
      const marker = syntaxMarker({ message: 'Unknown command "wherre". Did you mean "where"?' });
      seedSyntaxFix(marker, { title: 'Replace with "where"', text: 'where' });
      const actions = provide([marker]);
      expect(actions).toHaveLength(1);
      expect(actions[0].title).toBe('Replace with "where"');
      expect(editOf(actions[0]).text).toBe('where');
    });

    it('does not read a syntax fix off the lint table (channels are separate)', () => {
      const marker = syntaxMarker();
      // Seed the LINT table for this key; the syntax channel must not see it.
      const lintFixes = new Map<string, MarkerFix>();
      lintFixes.set(markerFixKey(marker), { title: 'lint-fix', text: 'x' });
      setModelFixes(model, lintFixes);
      expect(provide([marker])).toHaveLength(0);
    });

    it('produces no action for a syntax marker without a registered fix', () => {
      expect(provide([syntaxMarker()])).toHaveLength(0);
    });
  });
});
