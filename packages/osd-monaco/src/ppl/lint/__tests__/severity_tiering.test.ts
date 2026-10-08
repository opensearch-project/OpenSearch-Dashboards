/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic, LintSeverity } from '../diagnostic';
import { selectHighestSeverityTier } from '../severity_tiering';

const diagnostic = (ruleId: string, severity: LintSeverity): Diagnostic => ({
  ruleId,
  severity,
  message: ruleId,
  range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
});

describe('selectHighestSeverityTier', () => {
  it('returns every error and hides lower tiers', () => {
    const errorA = diagnostic('error-a', 'error');
    const errorB = diagnostic('error-b', 'error');
    expect(
      selectHighestSeverityTier([
        diagnostic('warning', 'warning'),
        errorA,
        diagnostic('info', 'info'),
        errorB,
      ])
    ).toEqual([errorA, errorB]);
  });

  it('returns every warning when there are no errors', () => {
    const warningA = diagnostic('warning-a', 'warning');
    const warningB = diagnostic('warning-b', 'warning');
    expect(selectHighestSeverityTier([diagnostic('info', 'info'), warningA, warningB])).toEqual([
      warningA,
      warningB,
    ]);
  });

  it('returns every info diagnostic when it is the highest tier', () => {
    const diagnostics = [diagnostic('info-a', 'info'), diagnostic('info-b', 'info')];
    expect(selectHighestSeverityTier(diagnostics)).toEqual(diagnostics);
  });

  it('returns an empty array for empty input', () => {
    expect(selectHighestSeverityTier([])).toEqual([]);
  });

  it('uses the resolved diagnostic severity rather than the rule id', () => {
    const overridden = diagnostic('normally-info', 'error');
    expect(
      selectHighestSeverityTier([diagnostic('normally-error', 'warning'), overridden])
    ).toEqual([overridden]);
  });
});
