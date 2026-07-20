/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';

// End-to-end regression for field-aware linting on the *compiled* analyzer (the
// sub-3.6 path). Unlike the detector unit tests, these drive `analyzer.lint`,
// which threads `sourceText` and `grammarSurface: 'compiled-simplified'` into
// the run context — the exact wiring the runtime-only gate used to skip.
describe('PPLLanguageAnalyzer.lint (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;

  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const ruleIds = (code: string): string[] => analyzer.lint(code).diagnostics.map((d) => d.ruleId);

  const diag = (code: string, ruleId: string, context?: object) =>
    analyzer.lint(code, context as any).diagnostics.find((d) => d.ruleId === ruleId);

  it('returns a LintResult with a diagnostics array', () => {
    const result = analyzer.lint('search source=logs');
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  it('never throws on arbitrary / broken input', () => {
    expect(() => analyzer.lint('')).not.toThrow();
    expect(() => analyzer.lint('|||')).not.toThrow();
    expect(() => analyzer.lint('search source=')).not.toThrow();
    expect(() => analyzer.lint('🙂 not ppl at all ###')).not.toThrow();
  });

  describe('field-validation field-slot shape (compiled surface via source text)', () => {
    it('flags grok field=body with an actionable fix on the compiled surface', () => {
      const query = 'source=logs | grok field=body "%{WORD:first}"';
      const d = diag(query, 'field-validation');
      // The catalog defaults field-validation to `error`.
      expect(d?.severity).toBe('error');
      expect(d?.fix?.text).toBe('body');
      expect(d?.message).toContain('grok');
      expect(d?.message).toContain('field name');
      expect(d?.range).toEqual({
        startLine: 1,
        startColumn: query.indexOf('field=body'),
        endLine: 1,
        endColumn: query.indexOf('field=body') + 'field=body'.length,
      });
    });

    it('flags parse field = message with an actionable fix on the compiled surface', () => {
      const d = diag('source=logs | parse field = message "x"', 'field-validation');
      expect(d?.severity).toBe('error');
      expect(d?.fix?.text).toBe('message');
      expect(d?.message).toContain('parse');
    });

    it('flags patterns field=body on the compiled surface', () => {
      const d = diag('source=logs | patterns field=body', 'field-validation');
      expect(d?.severity).toBe('error');
      expect(d?.fix?.text).toBe('body');
      expect(d?.message).toContain('patterns');
    });

    it('does not flag a bare source field', () => {
      expect(ruleIds('source=logs | grok body "%{WORD:first}"')).not.toContain('field-validation');
    });

    it('remaps field-slot ranges for pipe-first queries', () => {
      const d = diag('| grok field=body "x"', 'field-validation');
      expect(d?.range).toEqual({ startLine: 1, startColumn: 7, endLine: 1, endColumn: 17 });
      expect(d?.fix?.text).toBe('body');
    });

    it('does not duplicate unknown-field diagnostics inside the shape range', () => {
      const diags = analyzer
        .lint('source=logs | grok field=body "x"', { fields: new Set(['other']) })
        .diagnostics.filter((d) => d.ruleId === 'field-validation');

      expect(diags).toHaveLength(1);
      expect(diags[0].message).not.toContain('Unknown field');
    });
  });

  // The existence pass self-suppresses without a field list. On the compiled
  // (3.5) surface it already fires once the host forwards `fields` into the
  // worker context. These guard that field-aware linting works on the compiled
  // analyzer, not just the runtime grammar.
  describe('field-validation existence pass (compiled surface, with field list)', () => {
    it('flags an unknown field and suggests the closest known field', () => {
      const d = diag('source=logs | where severtyText = "x"', 'field-validation', {
        fields: new Set(['severityText', 'body', 'status']),
      });
      expect(d?.message).toContain('Unknown field "severtyText"');
      expect(d?.message).toContain('Did you mean "severityText"');
    });

    it('does not flag a field that exists in the list', () => {
      const ids = analyzer
        .lint('source=logs | where severityText = "x"', {
          fields: new Set(['severityText', 'body']),
        })
        .diagnostics.map((d) => d.ruleId);
      expect(ids).not.toContain('field-validation');
    });

    it('self-suppresses when no field list is present (R22.3)', () => {
      expect(ruleIds('source=logs | where severtyText = "x"')).not.toContain('field-validation');
    });
  });
});
