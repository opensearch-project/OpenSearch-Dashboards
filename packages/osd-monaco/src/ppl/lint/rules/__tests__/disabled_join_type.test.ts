/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { LintRunContext } from '../../types';

// On the compiled surface the disabled join keyword is only reachable through
// the `type=<keyword>` option form; the SQL-prefix form (`join right t`)
// misparses and is exercised against the runtime grammar elsewhere.
describe('disabled-join-type (compiled surface, option form)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string, ctx?: LintRunContext) =>
    analyzer.lint(code, ctx).diagnostics.map((d) => d.ruleId);
  const joinDiags = (code: string, ctx?: LintRunContext) =>
    analyzer.lint(code, ctx).diagnostics.filter((d) => d.ruleId === 'disabled-join-type');

  it('flags type=cross', () => {
    expect(ids('source=a | join type=cross b on a.id=b.id')).toContain('disabled-join-type');
  });

  it('reports the catalog message (not a hardcoded literal) with the keyword in hoverFacts', () => {
    const diagnostic = joinDiags('source=a | join type=cross b on a.id=b.id')[0];
    expect(diagnostic?.message).toBe(
      'This join type is disabled by default — enable plugins.calcite.all_join_types.allowed to use it.'
    );
    expect(diagnostic?.hoverFacts).toEqual({ joinType: 'cross' });
  });

  it('flags type=right', () => {
    expect(ids('source=a | join type=right b on a.id=b.id')).toContain('disabled-join-type');
  });

  it('flags type=full', () => {
    expect(ids('source=a | join type=full b on a.id=b.id')).toContain('disabled-join-type');
  });

  it('does not flag type=inner', () => {
    expect(ids('source=a | join type=inner b on a.id=b.id')).not.toContain('disabled-join-type');
  });

  it('does not flag type=left', () => {
    expect(ids('source=a | join type=left b on a.id=b.id')).not.toContain('disabled-join-type');
  });

  it('does not flag a plain join', () => {
    expect(ids('source=a | join b on a.id=b.id')).not.toContain('disabled-join-type');
  });

  it('suppresses when allJoinTypesAllowed is set', () => {
    const ctx: LintRunContext = { settings: { allJoinTypesAllowed: true } };
    expect(ids('source=a | join type=cross b on a.id=b.id', ctx)).not.toContain(
      'disabled-join-type'
    );
  });

  it('reports a nested disabled join exactly once (no duplicate at the same range)', () => {
    // A join whose right side is a subsearch that also contains a disabled join.
    // The nested `cross` must be reported once — not twice — and only the nested
    // join is disabled here (the outer join is a plain join).
    const diags = joinDiags('source=a | join b [ source=c | join type=cross d on c.id=d.id ]');
    expect(diags).toHaveLength(1);
    expect(diags[0].hoverFacts).toEqual({ joinType: 'cross' });
  });

  it('reports the outer disabled join even when a nested join is also disabled', () => {
    // Outer `type=full` and nested `type=cross`: both must be reported, and the
    // outer `full` must not be masked by the nested traversal.
    const diags = joinDiags(
      'source=a | join type=full b [ source=c | join type=cross d on c.id=d.id ] on a.id=b.id'
    );
    const keywords = diags.map((d) => d.hoverFacts?.joinType).sort();
    expect(keywords).toEqual(['cross', 'full']);
  });
});
