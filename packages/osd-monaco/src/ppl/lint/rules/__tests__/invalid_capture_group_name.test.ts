/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';

describe('invalid-capture-group-name (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string) => analyzer.lint(code).diagnostics.map((d) => d.ruleId);
  const diag = (code: string) =>
    analyzer.lint(code).diagnostics.find((d) => d.ruleId === 'invalid-capture-group-name');

  it('flags an invalid capture group name in rex', () => {
    expect(ids('source=logs | rex field=msg "(?<bad-name>\\\\d+)"')).toContain(
      'invalid-capture-group-name'
    );
  });

  it('does not flag a valid capture group name', () => {
    expect(ids('source=logs | rex field=msg "(?<good>\\\\d+)"')).not.toContain(
      'invalid-capture-group-name'
    );
  });

  it('flags the Python/PCRE opener', () => {
    expect(ids('source=logs | rex field=msg "(?P<name>\\\\d+)"')).toContain(
      'invalid-capture-group-name'
    );
  });

  it('does not flag grok %{PATTERN:subname} syntax', () => {
    expect(ids('source=logs | grok msg "%{NUMBER:duration}"')).not.toContain(
      'invalid-capture-group-name'
    );
  });

  describe('quick fixes', () => {
    it('offers a delete-P fix for the Python opener', () => {
      const d = diag('source=logs | rex field=msg "(?P<name>\\\\d+)"');
      expect(d?.fix).toBeDefined();
      expect(d?.fix?.text).toBe('');
      expect(d?.fix?.range).toBeDefined();
      const r = d!.fix!.range!;
      expect(r.startLine).toBe(r.endLine);
      expect(r.endColumn - r.startColumn).toBe(1);
    });

    it('offers a sanitize fix for a dashed name', () => {
      const d = diag('source=logs | rex field=msg "(?<bad-name>\\\\d+)"');
      expect(d?.fix).toEqual({ title: 'Remove invalid characters → "badname"', text: 'badname' });
    });

    it('strips leading digits', () => {
      const d = diag('source=logs | rex field=msg "(?<1name>\\\\d+)"');
      expect(d?.fix?.text).toBe('name');
    });

    it('offers no fix when sanitizing leaves nothing valid', () => {
      const d = diag('source=logs | rex field=msg "(?<123>\\\\d+)"');
      expect(d).toBeDefined();
      expect(d?.fix).toBeUndefined();
    });
  });
});
