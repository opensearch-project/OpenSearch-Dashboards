/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { Diagnostic } from '../../diagnostic';

// Backslash-free regex patterns (`[0-9]+`, `[a-z]+`) keep the JS-string →
// PPL-literal → range math unambiguous: what the test writes is exactly what the
// parser sees, so column offsets asserted below line up with the source text.
describe('invalid-capture-group-name (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const RULE = 'invalid-capture-group-name';
  const diags = (code: string): Diagnostic[] =>
    analyzer.lint(code).diagnostics.filter((d) => d.ruleId === RULE);
  const ids = (code: string) => analyzer.lint(code).diagnostics.map((d) => d.ruleId);

  describe('fires on each extraction command', () => {
    it('flags an invalid name in a rex pattern', () =>
      expect(ids('source=logs | rex field=body "(?<1bad>[0-9]+)"')).toContain(RULE));

    it('flags an invalid name in a parse pattern', () =>
      expect(ids('source=logs | parse body "(?<1bad>[0-9]+)"')).toContain(RULE));

    it('flags an invalid name in a grok pattern', () =>
      expect(ids('source=logs | grok body "(?<1bad>[0-9]+)"')).toContain(RULE));
  });

  describe('valid names are not flagged', () => {
    it('does not flag a valid Java named group', () =>
      expect(ids('source=logs | rex field=body "(?<year>[0-9]+)"')).not.toContain(RULE));

    it('does not flag an unnamed group', () =>
      expect(ids('source=logs | rex field=body "([0-9]+)"')).not.toContain(RULE));

    it('does not flag a query with no extraction command', () =>
      expect(ids('source=logs | where status = 200')).not.toContain(RULE));

    it('does not flag a lookbehind assertion (shares the "(?<" prefix)', () =>
      expect(ids('source=logs | rex field=body "(?<=id: )(?<year>[0-9]+)"')).not.toContain(RULE));

    it('does not flag a negative lookbehind assertion', () =>
      expect(ids('source=logs | rex field=body "(?<!id: )(?<year>[0-9]+)"')).not.toContain(RULE));

    it('still flags an invalid name that follows a lookbehind, on the right span', () => {
      const code = 'source=logs | rex field=body "(?<!x)(?<1bad>[0-9]+)"';
      const [d] = diags(code);
      expect(d).toBeDefined();
      expect(code.slice(d.range.startColumn, d.range.endColumn)).toBe('1bad');
    });
  });

  describe('invalid name (Fix B: strip disallowed characters)', () => {
    it('offers a sanitized replacement when a valid name remains', () => {
      const [d] = diags('source=logs | rex field=body "(?<user-id>[a-z]+)"');
      expect(d).toBeDefined();
      expect(d.message).toContain('user-id');
      // `user-id` -> strip non-alphanumerics -> `userid`.
      expect(d.fix).toEqual({ title: 'Remove invalid characters → "userid"', text: 'userid' });
    });

    it('withholds a fix when sanitizing leaves nothing valid', () => {
      // A digits-only name collapses to empty after stripping, so no fix is
      // offered (a fix would re-fire the same diagnostic).
      const [d] = diags('source=logs | rex field=body "(?<123>[0-9]+)"');
      expect(d).toBeDefined();
      expect(d.fix).toBeUndefined();
    });

    it('squiggles exactly the offending name', () => {
      const code = 'source=logs | rex field=body "(?<1bad>[0-9]+)"';
      const [d] = diags(code);
      expect(d).toBeDefined();
      expect(code.slice(d.range.startColumn, d.range.endColumn)).toBe('1bad');
      expect(d.range.startLine).toBe(1);
      expect(d.range.endLine).toBe(1);
    });
  });

  describe('Python/PCRE opener (Fix A: delete the P)', () => {
    it('flags "(?P<name>" even when the name itself is valid', () => {
      const [d] = diags('source=logs | rex field=body "(?P<year>[0-9]+)"');
      expect(d).toBeDefined();
      expect(d.message).toContain('(?P<year>');
    });

    it('offers a deletion fix that removes exactly the single P', () => {
      const code = 'source=logs | rex field=body "(?P<year>[0-9]+)"';
      const [d] = diags(code);
      expect(d).toBeDefined();
      expect(d.fix?.text).toBe('');
      expect(d.fix?.range).toBeDefined();
      const { startColumn, endColumn, startLine } = d.fix!.range!;
      expect(startLine).toBe(1);
      expect(endColumn - startColumn).toBe(1);
      // The fix must delete exactly the `P` between `(?` and `<`.
      expect(code.slice(startColumn, endColumn)).toBe('P');
    });
  });

  describe('multiple groups in one pattern', () => {
    it('flags each invalid group independently', () => {
      const found = diags('source=logs | rex field=body "(?<1a>[0-9]+)-(?<2b>[a-z]+)"');
      expect(found).toHaveLength(2);
      const joined = found.map((d) => d.message).join(' ');
      expect(joined).toContain('1a');
      expect(joined).toContain('2b');
    });
  });

  describe('pipe-first fix.range regression (the 9-column trap)', () => {
    // A pipe-first query is parsed with a synthetic `source=t ` prefix, then the
    // columns are shifted back. An explicit fix range (the `P`) must get the same
    // shift as the squiggle — otherwise the deletion lands 9 columns off.
    it('keeps the P-deletion fix range aligned with the user text', () => {
      const code = '| rex field=body "(?P<year>[0-9]+)"';
      const [d] = diags(code);
      expect(d).toBeDefined();
      expect(d.fix?.range).toBeDefined();
      const { startColumn, endColumn } = d.fix!.range!;
      expect(code.slice(startColumn, endColumn)).toBe('P');
    });

    it('keeps the squiggle range aligned with the user text on a pipe-first query', () => {
      const code = '| rex field=body "(?<1bad>[0-9]+)"';
      const [d] = diags(code);
      expect(d).toBeDefined();
      expect(code.slice(d.range.startColumn, d.range.endColumn)).toBe('1bad');
    });
  });

  it('carries the catalog docUrl (rex parameters anchor)', () => {
    const [d] = diags('source=logs | rex field=body "(?<1bad>[0-9]+)"');
    expect(d).toBeDefined();
    expect(d.docUrl).toBe(
      'https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/rex/#parameters'
    );
  });
});
