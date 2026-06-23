/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';

describe('head-without-sort (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string) => analyzer.lint(code).diagnostics.map((d) => d.ruleId);

  it('flags a head with no preceding sort', () =>
    expect(ids('search source=logs | head 5')).toContain('head-without-sort'));
  it('does not flag a head preceded by sort', () =>
    expect(ids('search source=logs | sort age | head 5')).not.toContain('head-without-sort'));
  it('flags a head when sort appears only after it', () =>
    expect(ids('search source=logs | head 5 | sort age')).toContain('head-without-sort'));
  it('flags head after an order-destroying command even if sort appeared earlier', () =>
    expect(ids('search source=logs | sort age | stats count() | head 5')).toContain(
      'head-without-sort'
    ));
  it('does not flag head after sort followed by order-preserving commands', () =>
    expect(ids('search source=logs | sort age | eval x=1 | where x>0 | head 5')).not.toContain(
      'head-without-sort'
    ));
  it('flags the second head when stats appears between two heads after a sort', () =>
    expect(ids('search source=logs | sort age | head 5 | stats count() | head 10')).toContain(
      'head-without-sort'
    ));
});
