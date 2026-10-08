/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { LintRunContext } from '../../types';

// `unionCommand` is runtime-only (absent on the compiled surface) and the rule
// is marked runtimeOnly, so it must stay silent under the compiled analyzer
// regardless of context. The firing path is exercised against the runtime
// grammar elsewhere.
describe('union-min-datasets (runtime-only rule)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string, ctx?: LintRunContext) =>
    analyzer.lint(code, ctx).diagnostics.map((d) => d.ruleId);

  it('does not fire on the compiled surface', () => {
    expect(ids('source=a | head 10')).not.toContain('union-min-datasets');
  });

  it('does not fire even with Calcite + compiled-surface context', () => {
    const ctx: LintRunContext = { isCalcite: true, grammarSurface: 'compiled-simplified' };
    expect(ids('source=a | head 10', ctx)).not.toContain('union-min-datasets');
  });
});
