/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import type { LintRunContext } from '../types';
import { getBundledCatalog } from '../catalog';

const RULE_ID = 'wildcard-source-zero-match';
const VISIBLE = ['logs-2024', 'logs-2025', 'accounts'];

describe('wildcard-source-zero-match', () => {
  let analyzer: PPLLanguageAnalyzer;

  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const diagnosticsFor = (code: string, context?: LintRunContext) =>
    analyzer.lint(code, context).diagnostics.filter((d) => d.ruleId === RULE_ID);

  describe('self-suppression', () => {
    it('does not fire without a visible-index list', () => {
      expect(diagnosticsFor('source=nope-*')).toHaveLength(0);
    });

    // An empty list means "we do not know what is visible", not "nothing matches".
    // Without this guard every wildcard source would report "matched 0 of 0".
    it('does not fire when the visible-index list is empty', () => {
      expect(diagnosticsFor('source=nope-*', { visibleIndices: [] })).toHaveLength(0);
    });

    it('fires when fields is empty but the visible-index list is populated', () => {
      expect(
        diagnosticsFor('source=nope-*', { fields: new Set<string>(), visibleIndices: VISIBLE })
      ).toHaveLength(1);
    });
  });

  describe('matching', () => {
    it('does not fire when the pattern matches a visible index', () => {
      expect(diagnosticsFor('source=logs-*', { visibleIndices: VISIBLE })).toHaveLength(0);
    });

    it('does not fire on an exact (non-wildcard) source name', () => {
      expect(diagnosticsFor('source=absent_index', { visibleIndices: VISIBLE })).toHaveLength(0);
    });

    it('fires when the pattern matches no visible index', () => {
      expect(diagnosticsFor('source=nope-*', { visibleIndices: VISIBLE })).toHaveLength(1);
    });

    it('anchors the pattern rather than substring-matching', () => {
      // `og-*` must not match `logs-2024`; the pattern is anchored at both ends.
      expect(diagnosticsFor('source=og-*', { visibleIndices: VISIBLE })).toHaveLength(1);
    });

    it('treats a regex metacharacter in the pattern literally', () => {
      // `.` is escaped, so `logs.*` matches a literal dot, which nothing has.
      expect(diagnosticsFor('source=logs.*', { visibleIndices: VISIBLE })).toHaveLength(1);
    });
  });

  describe('reported diagnostic', () => {
    it('reports the catalog message, not an interpolated literal', () => {
      const catalogMessage = getBundledCatalog().find((r) => r.id === RULE_ID)?.message;
      const [diagnostic] = diagnosticsFor('source=nope-*', { visibleIndices: VISIBLE });
      expect(diagnostic.message).toBe(catalogMessage);
    });

    it('carries the pattern and index count as hover facts', () => {
      const [diagnostic] = diagnosticsFor('source=nope-*', { visibleIndices: VISIBLE });
      expect(diagnostic.hoverFacts).toMatchObject({
        pattern: 'nope-*',
        totalIndices: VISIBLE.length,
      });
    });

    it('offers prefix-matched candidates from the leading literal run', () => {
      // Anchored, so `logs*archive` matches nothing, but its `logs` prefix does
      // name two real indices — exactly the "did you mean" case.
      const [diagnostic] = diagnosticsFor('source=logs*archive', { visibleIndices: VISIBLE });
      expect(diagnostic.hoverFacts?.candidateIndices).toEqual(['logs-2024', 'logs-2025']);
    });

    it('offers no candidates when nothing shares the literal run', () => {
      const [diagnostic] = diagnosticsFor('source=nope-*', { visibleIndices: VISIBLE });
      expect(diagnostic.hoverFacts?.candidateIndices).toBeUndefined();
    });

    it('offers no candidates when the literal run is too short to be a useful hint', () => {
      const [diagnostic] = diagnosticsFor('source=z*', { visibleIndices: VISIBLE });
      expect(diagnostic.hoverFacts?.candidateIndices).toBeUndefined();
    });

    it('ranges over the source pattern', () => {
      const [diagnostic] = diagnosticsFor('source=nope-*', { visibleIndices: VISIBLE });
      expect(diagnostic.range.startColumn).toBeLessThan(diagnostic.range.endColumn);
    });
  });
});
