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
  const calcite: LintRunContext = { isCalcite: true };

  it('flags consecutive=true on a Calcite source', () => {
    expect(ids('source=a | dedup 1 status consecutive=true', calcite)).toContain(
      'dedup-consecutive-unsupported'
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
    expect(ids('source=a | dedup 1 status consecutive=true')).not.toContain(
      'dedup-consecutive-unsupported'
    );
  });
});
