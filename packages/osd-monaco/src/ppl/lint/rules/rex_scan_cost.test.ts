/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import type { LintRunContext } from '../types';

// `rex-scan-cost` is an advisory, `info`-severity rule that flags pattern
// extraction (`rex`/`parse`/`grok`) over a `text`-mapped source field. It ships
// disabled by default (like the explain-backed rules), so every assertion here
// enables it through the per-rule override, matching how the host resolves
// uiSettings into `context.overrides`.
//
// Assertions run on the compiled (simplified-grammar) surface, matching the
// existing analyzer_lint.test.ts / silent_failure_rules.test.ts suites. `rex`
// exists only on that surface; `parse`/`grok` exist on both.

describe('rex-scan-cost (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;

  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const typeMap = new Map<string, string>([
    ['raw_log', 'text'],
    ['message', 'text'],
    ['email', 'text'],
    ['host', 'keyword'],
    ['status', 'long'],
  ]);
  const fields = new Set<string>([...typeMap.keys()]);

  // Enable the default-off rule the same way the host does — via a per-rule
  // override threaded through the lint context.
  const enabled: LintRunContext = {
    fields,
    typeMap,
    overrides: { 'rex-scan-cost': { enabled: true } },
  };

  const ids = (code: string, context: LintRunContext): string[] =>
    analyzer.lint(code, context).diagnostics.map((d) => d.ruleId);

  const diag = (code: string, context: LintRunContext = enabled) =>
    analyzer.lint(code, context).diagnostics.find((d) => d.ruleId === 'rex-scan-cost');

  describe('fires on extraction over a text source field', () => {
    it('flags rex over a text field', () => {
      expect(ids('source=logs | rex field=raw_log "GET (?<path>\\S+)"', enabled)).toContain(
        'rex-scan-cost'
      );
    });

    it('flags parse over a text field', () => {
      expect(ids('source=logs | parse email "(?<user>.+)@"', enabled)).toContain('rex-scan-cost');
    });

    it('flags grok over a text field', () => {
      expect(ids('source=logs | grok message "%{IP:client}"', enabled)).toContain('rex-scan-cost');
    });

    it('resolves the rex source field, not an offset_field option', () => {
      // `off` is not in the typeMap; if the detector mistook the offset field for
      // the source field it would not fire. It fires on the text source `raw_log`.
      expect(
        ids('source=logs | rex field=raw_log offset_field=off "GET (?<path>\\S+)"', enabled)
      ).toContain('rex-scan-cost');
    });
  });

  describe('does not fire on non-text or unknown source fields', () => {
    it('does not flag rex over a keyword field', () => {
      expect(ids('source=logs | rex field=host "(?<h>\\S+)"', enabled)).not.toContain(
        'rex-scan-cost'
      );
    });

    it('does not flag parse over a numeric field', () => {
      expect(ids('source=logs | parse status "(?<s>\\d+)"', enabled)).not.toContain(
        'rex-scan-cost'
      );
    });

    it('does not flag extraction over a field missing from the typeMap', () => {
      expect(ids('source=logs | grok unknown_field "%{IP:client}"', enabled)).not.toContain(
        'rex-scan-cost'
      );
    });

    it('does not flag a Splunk-style "field=" parse shape (not a bare field)', () => {
      // `parse field=email "..."` is not a bare-field source; it is field-
      // validation's concern, not this rule's, so no scan-cost finding here.
      const found = analyzer
        .lint('source=logs | parse field=email "(?<u>.+)"', enabled)
        .diagnostics.filter((d) => d.ruleId === 'rex-scan-cost');
      expect(found).toHaveLength(0);
    });
  });

  describe('context and default gating', () => {
    it('self-suppresses without a typeMap', () => {
      expect(
        ids('source=logs | rex field=raw_log "GET (?<path>\\S+)"', {
          fields,
          overrides: { 'rex-scan-cost': { enabled: true } },
        })
      ).not.toContain('rex-scan-cost');
    });

    it('ships disabled by default (no finding without the override)', () => {
      expect(
        ids('source=logs | rex field=raw_log "GET (?<path>\\S+)"', { fields, typeMap })
      ).not.toContain('rex-scan-cost');
    });
  });

  describe('scope and shape', () => {
    it('does not fire for extraction inside an alternate-source subtree', () => {
      // The outer typeMap describes `logs`, not the appended `other` source, so a
      // parse inside the append must not be judged against the outer field types.
      expect(
        ids('source=logs | append [ source=other | parse message "(?<m>.+)" ]', enabled)
      ).not.toContain('rex-scan-cost');
    });

    it('attaches no quick-fix (advisory only)', () => {
      expect(diag('source=logs | rex field=raw_log "GET (?<path>\\S+)"')?.fix).toBeUndefined();
    });

    it('emits info severity', () => {
      expect(diag('source=logs | grok message "%{IP:client}"')?.severity).toBe('info');
    });

    it('never throws on the sample queries', () => {
      const samples = [
        'source=logs | rex field=raw_log "GET (?<path>\\S+)"',
        'source=logs | parse email "(?<user>.+)@"',
        'source=logs | grok message "%{IP:client}"',
      ];
      for (const sample of samples) {
        expect(() => analyzer.lint(sample, enabled)).not.toThrow();
      }
    });
  });

  describe('message and hover facts', () => {
    it('names the extraction keyword and the text source field', () => {
      const found = diag('source=logs | rex field=raw_log "GET (?<path>\\S+)"');
      expect(found?.message).toContain('rex runs the pattern against every input row');
      expect(found?.message).toContain('text field "raw_log"');
    });

    it('names the keyword for parse and grok too', () => {
      expect(diag('source=logs | parse email "(?<user>.+)@"')?.message).toContain(
        'parse runs the pattern'
      );
      expect(diag('source=logs | grok message "%{IP:client}"')?.message).toContain(
        'grok runs the pattern'
      );
    });

    it('carries { field, esType } hover facts and no suggestion', () => {
      const found = diag('source=logs | rex field=raw_log "GET (?<path>\\S+)"');
      expect(found?.hoverFacts).toEqual({ field: 'raw_log', esType: 'text' });
    });
  });
});
