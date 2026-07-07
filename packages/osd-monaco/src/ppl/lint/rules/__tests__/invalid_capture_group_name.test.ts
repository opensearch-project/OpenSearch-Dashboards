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

  it('does not flag grok semantic names with typed/dashed forms', () => {
    // Grok %{...} syntax never matches the (?<name>) opener scan, so grok-legal
    // names (typed captures, dashes) must not be treated as Java group names.
    expect(ids('source=logs | grok msg "%{NUMBER:duration:int}"')).not.toContain(
      'invalid-capture-group-name'
    );
    expect(ids('source=logs | grok msg "%{DATA:my-field}"')).not.toContain(
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

  describe('range offsets (measured from the token, quotes included)', () => {
    it('points the diagnostic at the group name, not one column to the left', () => {
      const q = 'source=logs | rex field=msg "(?<bad-name>\\\\d+)"';
      const expectedCol = q.indexOf('bad-name');
      const d = diag(q);
      expect(d?.range.startLine).toBe(1);
      expect(d?.range.startColumn).toBe(expectedCol);
      expect(d?.range.endColumn).toBe(expectedCol + 'bad-name'.length);
    });

    it('points the delete-P fix at the P character', () => {
      const q = 'source=logs | rex field=msg "(?P<name>\\\\d+)"';
      const expectedCol = q.indexOf('P');
      const d = diag(q);
      expect(d?.fix?.range?.startColumn).toBe(expectedCol);
      expect(d?.fix?.range?.endColumn).toBe(expectedCol + 1);
    });
  });

  describe('empty group name', () => {
    it('flags "(?<>...)" with a dedicated message and no fix', () => {
      const q = 'source=logs | rex field=msg "(?<>\\\\d+)"';
      const d = diag(q);
      expect(d).toBeDefined();
      expect(d?.message).toBe(
        'Named capture group is missing a name; add one matching ^[A-Za-z][A-Za-z0-9]*$.'
      );
      expect(d?.fix).toBeUndefined();
      // Range spans the whole empty "<>" pair, not just the closing ">".
      const ltCol = q.indexOf('(?<') + 2;
      expect(d?.range.startColumn).toBe(ltCol);
      expect(d?.range.endColumn).toBe(ltCol + 2);
    });
  });
});
