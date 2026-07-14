/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';

describe('unsupported-window-function-in-eventstats (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });
  const ids = (code: string) => analyzer.lint(code).diagnostics.map((d) => d.ruleId);

  it('flags rank as a window function', () => {
    expect(ids('source=logs | eventstats rank() as r by status')).toContain(
      'unsupported-window-function-in-eventstats'
    );
  });

  it('reports the catalog message (not a hardcoded literal) and carries the fn in hoverFacts', () => {
    const diagnostic = analyzer
      .lint('source=logs | eventstats rank() as r by status')
      .diagnostics.find((d) => d.ruleId === 'unsupported-window-function-in-eventstats');
    expect(diagnostic?.message).toBe(
      'This window function is not supported in eventstats/streamstats — only row_number is available.'
    );
    expect(diagnostic?.hoverFacts).toEqual({ windowFunction: 'rank' });
  });

  it('does not flag row_number', () => {
    expect(ids('source=logs | eventstats row_number() as r by status')).not.toContain(
      'unsupported-window-function-in-eventstats'
    );
  });

  it('does not flag a plain aggregate like avg', () => {
    expect(ids('source=logs | eventstats avg(bytes) as a by status')).not.toContain(
      'unsupported-window-function-in-eventstats'
    );
  });

  it('flags dense_rank', () => {
    expect(ids('source=logs | eventstats dense_rank() as r by status')).toContain(
      'unsupported-window-function-in-eventstats'
    );
  });

  it('flags ntile', () => {
    expect(ids('source=logs | eventstats ntile(4) as r by status')).toContain(
      'unsupported-window-function-in-eventstats'
    );
  });
});
