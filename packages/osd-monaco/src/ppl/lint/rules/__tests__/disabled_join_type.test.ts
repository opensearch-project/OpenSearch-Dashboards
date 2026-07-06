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

  it('flags type=cross', () => {
    expect(ids('source=a | join type=cross b on a.id=b.id')).toContain('disabled-join-type');
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
});
