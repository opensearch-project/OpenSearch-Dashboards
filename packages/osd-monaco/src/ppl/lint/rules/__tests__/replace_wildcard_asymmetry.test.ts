/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { LintRunContext } from '../../types';
import { countUnescapedWildcards } from '../replace_wildcard_asymmetry';

describe('replace-wildcard-asymmetry (runtime-only rule)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string, ctx?: LintRunContext) =>
    analyzer.lint(code, ctx).diagnostics.map((d) => d.ruleId);

  // `replacePair` is runtime-only (absent on the compiled surface) and the rule
  // is runtimeOnly, so it stays silent under the compiled analyzer.
  it('does not fire on the compiled surface', () => {
    expect(ids('source=a | head 10')).not.toContain('replace-wildcard-asymmetry');
  });

  it('does not fire even with Calcite + compiled-surface context', () => {
    const ctx: LintRunContext = { isCalcite: true, grammarSurface: 'compiled-simplified' };
    expect(ids('source=a | head 10', ctx)).not.toContain('replace-wildcard-asymmetry');
  });
});

describe('countUnescapedWildcards', () => {
  it('counts bare wildcards', () => {
    expect(countUnescapedWildcards('a*b*c')).toBe(2);
  });

  it('ignores escaped wildcards', () => {
    expect(countUnescapedWildcards('a\\*b')).toBe(0);
  });

  it('counts an unescaped wildcard after an escaped backslash', () => {
    // `\\*` — the backslash is escaped, so the `*` is a real wildcard.
    expect(countUnescapedWildcards('a\\\\*b')).toBe(1);
  });

  it('returns 0 for a string with no wildcards', () => {
    expect(countUnescapedWildcards('abc')).toBe(0);
  });
});
