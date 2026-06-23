/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { LintRunContext } from '../../types';

describe('division-by-zero (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ctx: LintRunContext = {
    fields: new Set(['balance']),
    typeMap: new Map([['balance', 'long']]),
  };
  const ids = (code: string, c?: LintRunContext) =>
    analyzer.lint(code, c).diagnostics.map((d) => d.ruleId);

  it('flags division by literal zero', () =>
    expect(ids('search accounts | eval x = balance / 0', ctx)).toContain('division-by-zero'));
  it('flags division by a decimal zero', () =>
    expect(ids('search accounts | eval x = balance / 0.0', ctx)).toContain('division-by-zero'));
  it('does not flag division by a non-zero literal', () =>
    expect(ids('search accounts | eval x = balance / 2', ctx)).not.toContain('division-by-zero'));
  it('does not flag modulo by zero', () =>
    expect(ids('search accounts | eval x = balance % 0', ctx)).not.toContain('division-by-zero'));
  it('fires even without a lint context', () =>
    expect(ids('search accounts | eval x = balance / 0')).toContain('division-by-zero'));
});
