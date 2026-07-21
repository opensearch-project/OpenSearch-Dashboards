/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { Diagnostic } from '../../diagnostic';

// Backslash-free regex bodies (`[0-9]+`, `[a-z]+`) keep the JS-string →
// PPL-literal → range math unambiguous where a test asserts column offsets: what
// the test writes is exactly what the parser sees. The engine-agreement
// regressions that need a backslash (escaped opener, `\Q…\E`) use it only inside
// the pattern text, never near an asserted column.
describe('invalid-capture-group-name (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const RULE = 'invalid-capture-group-name';
  // Default to a >= 3.4 cluster: capture-group name validation runs from 3.4 on
  // (OpenSearch SQL #4434), so that is the context under which the rule fires.
  const V34 = { dataSourceVersion: '3.4.0' };
  const diags = (code: string, ctx = V34): Diagnostic[] =>
    analyzer.lint(code, ctx).diagnostics.filter((d) => d.ruleId === RULE);
  const ids = (code: string, ctx = V34) =>
    analyzer.lint(code, ctx).diagnostics.map((d) => d.ruleId);

  describe('fires on rex-extract and parse (not grok, not sed)', () => {
    it('flags an invalid name in a rex extract pattern', () =>
      expect(ids('source=logs | rex field=body "(?<1bad>[0-9]+)"')).toContain(RULE));

    it('flags an invalid name in a parse pattern', () =>
      expect(ids('source=logs | parse body "(?<1bad>[0-9]+)"')).toContain(RULE));

    it('does NOT flag a grok pattern (different dialect, not validated here)', () =>
      expect(ids('source=logs | grok body "(?<1bad>[0-9]+)"')).not.toContain(RULE));

    it('does NOT flag a Python-looking grok pattern', () =>
      expect(ids('source=logs | grok body "(?P<year>[0-9]+)"')).not.toContain(RULE));

    it('does NOT flag rex mode=sed (pattern is a sed substitution, not group names)', () =>
      expect(ids('source=logs | rex field=body mode=sed "s/(?<1bad>[0-9]+)/x/g"')).not.toContain(
        RULE
      ));

    it('does NOT flag rex mode=SED (uppercase — lexer is case-insensitive)', () =>
      expect(ids('source=logs | rex field=body mode=SED "s/(?<1bad>[0-9]+)/x/g"')).not.toContain(
        RULE
      ));

    it('does NOT flag rex mode=Sed (mixed case)', () =>
      expect(ids('source=logs | rex field=body mode=Sed "s/(?<1bad>[0-9]+)/x/g"')).not.toContain(
        RULE
      ));

    it('still flags rex mode=extract explicitly', () =>
      expect(ids('source=logs | rex field=body mode=extract "(?<1bad>[0-9]+)"')).toContain(RULE));

    it('still flags rex with a leading max_match option before mode=sed is absent', () =>
      expect(ids('source=logs | rex field=body max_match=2 "(?<1bad>[0-9]+)"')).toContain(RULE));
  });

  describe('grok semantic names are never flagged', () => {
    it.each(['%{WORD:user-id}', '%{NUMBER:1level}', '%{DATA:has space}', '%{WORD:snake_case}'])(
      'does not flag grok semantic name in %s',
      (pattern) => {
        expect(ids(`source=logs | grok body "${pattern}"`)).not.toContain(RULE);
      }
    );
  });

  describe('valid names are not flagged', () => {
    it('does not flag a valid Java named group', () =>
      expect(ids('source=logs | rex field=body "(?<year>[0-9]+)"')).not.toContain(RULE));

    it('does not flag an unnamed group', () =>
      expect(ids('source=logs | rex field=body "([0-9]+)"')).not.toContain(RULE));

    it('does not flag a query with no extraction command', () =>
      expect(ids('source=logs | where status = 200')).not.toContain(RULE));

    it('does not flag a malformed opener with no ">" terminator', () =>
      // `(?<name` never closes, so the naive scan finds no `>`-terminated name —
      // exactly what the engine's scan does.
      expect(ids('source=logs | rex field=body "(?<name[0-9]+)"')).not.toContain(RULE));
  });

  describe('engine agreement: the naive scan flags what OpenSearch 3.4+ rejects', () => {
    // OpenSearch's validator (RegexCommonUtils.ANY_NAMED_GROUP_PATTERN) is
    // lexerless: it reads named-group openers out of escaped text, character
    // classes, `\Q…\E`, and after a lookbehind, and rejects an invalid name
    // found there. This rule must agree — flagging these is correct, not a false
    // positive. Removing the PR's `(?![=!])` lookbehind exclusion is what makes
    // the bare-lookbehind case fire.

    it('flags an invalid name after an escaped opener', () =>
      expect(ids('source=logs | rex field=body "\\\\(?<1bad>[0-9]+)"')).toContain(RULE));

    it('flags an invalid name inside a character class', () =>
      expect(ids('source=logs | rex field=body "[(?<1bad>][0-9]+"')).toContain(RULE));

    it('flags an invalid name inside a \\Q…\\E quote', () =>
      expect(ids('source=logs | rex field=body "\\\\Q(?<1bad>\\\\E[0-9]+"')).toContain(RULE));

    it('flags an invalid name after a positive lookbehind', () =>
      expect(ids('source=logs | rex field=body "(?<=x)(?<1bad>[0-9]+)"')).toContain(RULE));

    it('flags an invalid name after a negative lookbehind', () =>
      expect(ids('source=logs | rex field=body "(?<!x)(?<1bad>[0-9]+)"')).toContain(RULE));

    it('flags a bare lookbehind the engine rejects with a phantom name', () => {
      // `(?<=x )(?<word>…)`: the engine's naive scan reads the phantom name
      // `=x )(?<word` (everything up to the first `>`), which is invalid, so the
      // engine 400s and the rule must flag it. The PR previously excluded this.
      const code = 'source=logs | rex field=body "(?<=x )(?<word>[0-9]+)"';
      const [d] = diags(code);
      expect(d).toBeDefined();
      // The squiggle covers the phantom name the engine complains about.
      expect(code.slice(d.range.startColumn, d.range.endColumn)).toBe('=x )(?<word');
    });
  });

  describe('invalid Java name: diagnostic, no rename fix', () => {
    it('reports the name and offers no fix (renaming would change the field)', () => {
      const [d] = diags('source=logs | rex field=body "(?<user-id>[a-z]+)"');
      expect(d).toBeDefined();
      expect(d.message).toContain('user-id');
      expect(d.fix).toBeUndefined();
    });

    it('offers no fix for a digits-only name', () => {
      const [d] = diags('source=logs | rex field=body "(?<123>[0-9]+)"');
      expect(d).toBeDefined();
      expect(d.fix).toBeUndefined();
    });

    it('offers no fix for a punctuation-only name', () => {
      const [d] = diags('source=logs | rex field=body "(?<--->[0-9]+)"');
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

  describe('Python/PCRE opener with a valid name: diagnostic + P-deletion fix', () => {
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
      expect(code.slice(startColumn, endColumn)).toBe('P');
    });

    it('flags a Python opener in parse too', () =>
      expect(ids('source=logs | parse body "(?P<year>[0-9]+)"')).toContain(RULE));
  });

  describe('Python/PCRE opener with an invalid name: combined diagnostic, no fix', () => {
    it('reports both defects in one message and offers no fix', () => {
      const found = diags('source=logs | rex field=body "(?P<bad-name>[0-9]+)"');
      // Exactly one diagnostic (combined), not two overlapping markers.
      expect(found).toHaveLength(1);
      const [d] = found;
      expect(d.message).toContain('bad-name');
      expect(d.message.toLowerCase()).toContain('not supported');
      expect(d.fix).toBeUndefined();
    });
  });

  describe('Python opener that would collide when converted: diagnostic, no fix', () => {
    it('withholds the P-deletion fix when the resulting name duplicates a Java group', () => {
      // Converting `(?P<year>` to `(?<year>` would create two `year` groups,
      // which the engine rejects. Both openers are flagged; the Python one gets
      // no fix.
      const code = 'source=logs | rex field=body "(?<year>[0-9]+)(?P<year>[a-z]+)"';
      const found = diags(code);
      // The valid Java `(?<year>` is accepted (no diagnostic); only the Python
      // opener is flagged, and it carries no fix because converting collides.
      const pythonDiag = found.find((d) => d.message.includes('(?P<year>'));
      expect(pythonDiag).toBeDefined();
      expect(pythonDiag!.fix).toBeUndefined();
    });

    it('withholds the fix when two Python openers share a name', () => {
      const code = 'source=logs | rex field=body "(?P<year>[0-9]+)(?P<year>[a-z]+)"';
      const found = diags(code);
      expect(found).toHaveLength(2);
      expect(found.every((d) => d.fix === undefined)).toBe(true);
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

  describe('version gating (#4434 shipped in 3.4)', () => {
    const code = 'source=logs | rex field=body "(?<1bad>[0-9]+)"';
    const parseCode = 'source=logs | parse body "(?<1bad>[0-9]+)"';

    it('fires on a >= 3.4 cluster', () => {
      expect(ids(code, { dataSourceVersion: '3.4.0' })).toContain(RULE);
      expect(ids(code, { dataSourceVersion: '3.8.0' })).toContain(RULE);
      expect(ids(parseCode, { dataSourceVersion: '3.4.0' })).toContain(RULE);
    });

    it('does NOT fire on a pre-3.4 cluster (invalid names are a silent no-op there)', () => {
      expect(ids(code, { dataSourceVersion: '3.3.0' })).not.toContain(RULE);
      expect(ids(parseCode, { dataSourceVersion: '3.3.0' })).not.toContain(RULE);
      expect(ids(code, { dataSourceVersion: '2.19.0' })).not.toContain(RULE);
    });

    it('fires when the version is unknown (documented default: fire, like sibling minVersion rules)', () => {
      // With no dataSourceVersion, appliesTo self-suppresses only maxVersion
      // rules; a minVersion-only rule below OSD_KNOWN_VERSION stays on.
      expect(analyzer.lint(code).diagnostics.map((d) => d.ruleId)).toContain(RULE);
    });
  });

  describe('quick-fix round-trip: applying a fix clears the rule', () => {
    // Apply the fix's exact text/range to the source and re-lint; the rule must
    // be gone and no duplicate-name condition introduced.
    const applyFix = (code: string, d: Diagnostic): string => {
      const fix = d.fix!;
      const range = fix.range ?? d.range;
      // Single-line queries only in these cases; splice by column.
      expect(range.startLine).toBe(1);
      expect(range.endLine).toBe(1);
      return code.slice(0, range.startColumn) + fix.text + code.slice(range.endColumn);
    };

    it('valid Python name (source-first): fix present, clears on re-lint', () => {
      const code = 'source=logs | rex field=body "(?P<year>[0-9]+)"';
      const [d] = diags(code);
      expect(d.fix).toBeDefined();
      const fixed = applyFix(code, d);
      expect(fixed).toBe('source=logs | rex field=body "(?<year>[0-9]+)"');
      expect(ids(fixed)).not.toContain(RULE);
    });

    it('valid Python name (pipe-first): fix present, clears on re-lint', () => {
      const code = '| rex field=body "(?P<year>[0-9]+)"';
      const [d] = diags(code);
      expect(d.fix).toBeDefined();
      const fixed = applyFix(code, d);
      expect(fixed).toBe('| rex field=body "(?<year>[0-9]+)"');
      expect(ids(fixed)).not.toContain(RULE);
    });

    it('valid Python name in parse: fix present, clears on re-lint', () => {
      const code = 'source=logs | parse body "(?P<year>[0-9]+)"';
      const [d] = diags(code);
      expect(d.fix).toBeDefined();
      const fixed = applyFix(code, d);
      expect(fixed).toBe('source=logs | parse body "(?<year>[0-9]+)"');
      expect(ids(fixed)).not.toContain(RULE);
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
