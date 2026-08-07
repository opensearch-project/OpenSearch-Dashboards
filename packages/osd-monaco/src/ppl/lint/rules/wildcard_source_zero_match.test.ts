/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import type { LintRunContext } from '../types';
import { getBundledCatalog } from '../catalog';
import { isSimpleLocalWildcardPattern } from './wildcard_source_zero_match';

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

    it.each([
      ['multi-target', 'source=logs-*,metrics-*'],
      ['exclusion', 'source=-logs-*'],
      ['date math', 'source=<logs-{now/d}-*>'],
      ['cross-cluster', 'source=remote:logs-*'],
      ['hidden/system', 'source=.plugins-*'],
    ])('does not diagnose an unsupported %s source', (_label, code) => {
      expect(diagnosticsFor(code, { visibleIndices: VISIBLE })).toHaveLength(0);
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

    it('ranges over the source pattern', () => {
      const [diagnostic] = diagnosticsFor('source=nope-*', { visibleIndices: VISIBLE });
      expect(diagnostic.range.startColumn).toBeLessThan(diagnostic.range.endColumn);
    });

    it('emits warning severity', () => {
      const [diagnostic] = diagnosticsFor('source=nope-*', { visibleIndices: VISIBLE });
      expect(diagnostic.severity).toBe('warning');
    });
  });
});

describe('isSimpleLocalWildcardPattern', () => {
  it.each(['logs-*', 'logs-2026.07.*', 'logs_+archive-*'])('accepts %s', (pattern) => {
    expect(isSimpleLocalWildcardPattern(pattern)).toBe(true);
  });

  it.each([
    'logs',
    'logs-*,metrics-*',
    '-logs-*',
    '.plugins-*',
    '<logs-{now/d}-*>',
    'remote:logs-*',
    'logs-?',
    'logs *',
    'logs\\-*',
  ])('rejects unsupported pattern %s', (pattern) => {
    expect(isSimpleLocalWildcardPattern(pattern)).toBe(false);
  });
});
