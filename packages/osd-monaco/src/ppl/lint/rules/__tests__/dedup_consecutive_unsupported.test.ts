/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { LintRunContext } from '../../types';

describe('dedup-consecutive-unsupported (Calcite-gated warning)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string, ctx?: LintRunContext) =>
    analyzer.lint(code, ctx).diagnostics.map((d) => d.ruleId);
  const enabled: LintRunContext = {
    overrides: { 'dedup-consecutive-unsupported': { enabled: true } },
  };
  const calcite: LintRunContext = { ...enabled, isCalcite: true };

  it('flags consecutive=true on a Calcite source', () => {
    expect(ids('source=a | dedup 1 status consecutive=true', calcite)).toContain(
      'dedup-consecutive-unsupported'
    );
  });

  it('reports the catalog message (not a hardcoded literal)', () => {
    const diagnostic = analyzer
      .lint('source=a | dedup 1 status consecutive=true', calcite)
      .diagnostics.find((d) => d.ruleId === 'dedup-consecutive-unsupported');
    expect(diagnostic?.message).toBe(
      'consecutive=true uses an older query engine and may make this query slower.'
    );
  });

  it('does not flag consecutive=false', () => {
    expect(ids('source=a | dedup 1 status consecutive=false', calcite)).not.toContain(
      'dedup-consecutive-unsupported'
    );
  });

  it('does not flag a plain dedup', () => {
    expect(ids('source=a | dedup status', calcite)).not.toContain('dedup-consecutive-unsupported');
  });

  it('does not fire without a Calcite context', () => {
    expect(ids('source=a | dedup 1 status consecutive=true', enabled)).not.toContain(
      'dedup-consecutive-unsupported'
    );
  });
});
