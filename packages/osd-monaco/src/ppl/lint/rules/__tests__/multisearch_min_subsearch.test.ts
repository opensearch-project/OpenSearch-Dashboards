/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { LintRunContext } from '../../types';

describe('multisearch-min-subsearch (runtime-only rule)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string, ctx?: LintRunContext) =>
    analyzer.lint(code, ctx).diagnostics.map((d) => d.ruleId);

  it('does not fire on the compiled surface (runtimeOnly)', () => {
    expect(ids('source=logs | head 10')).not.toContain('multisearch-min-subsearch');
  });

  it('does not fire even with explicit context on compiled surface', () => {
    const ctx: LintRunContext = { grammarSurface: 'compiled-simplified' };
    expect(ids('source=logs | head 10', ctx)).not.toContain('multisearch-min-subsearch');
  });
});
