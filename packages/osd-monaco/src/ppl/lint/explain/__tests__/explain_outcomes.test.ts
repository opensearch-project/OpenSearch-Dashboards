/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectExplainOutcomes } from '../explain_outcomes';
import { ExplainPlan } from '../explain_types';

describe('detectExplainOutcomes', () => {
  it('keeps tree evidence relation-local so a native filter cannot hide a residual filter', () => {
    const plan: ExplainPlan = {
      isCalcite: true,
      physicalTree: {
        rels: [
          {
            id: 'scan',
            relOp: 'CalciteEnumerableIndexScan',
            PushDownContext: ['FILTER->>($0, 1)'],
          },
          {
            id: 'calc',
            relOp: 'EnumerableCalc',
            $condition: '[$t2]',
          },
        ],
      },
    };

    expect(detectExplainOutcomes(plan)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ outcome: 'filter:native', scope: 'rel:scan' }),
        expect.objectContaining({ outcome: 'filter:coordinator', scope: 'rel:calc' }),
      ])
    );
  });

  it('requires a script tag and discriminator on the same tree relation', () => {
    const plan: ExplainPlan = {
      isCalcite: true,
      physicalTree: {
        rels: [
          {
            id: 'tag',
            relOp: 'CalciteEnumerableIndexScan',
            PushDownContext: ['SCRIPT->>($0, 1)'],
          },
          {
            id: 'builder',
            relOp: 'EnumerableCalc',
            sourceBuilder: { lang: 'opensearch_compounded_script' },
          },
        ],
      },
    };

    expect(detectExplainOutcomes(plan).map(({ outcome }) => outcome)).not.toContain(
      'filter:script'
    );
  });

  it('recognizes native, scripted, and coordinator sort outcomes', () => {
    const native: ExplainPlan = {
      isCalcite: true,
      physicalText: 'CalciteEnumerableIndexScan(PushDownContext=[[SORT->[bytes ASC]]])',
    };
    const script: ExplainPlan = {
      isCalcite: true,
      physicalText:
        'CalciteEnumerableIndexScan(PushDownContext=[[SORT_EXPR->[x ASC]]], sourceBuilder=opensearch_compounded_script)',
    };
    const coordinator: ExplainPlan = {
      isCalcite: true,
      physicalText: 'EnumerableSort(input=EnumerableCalc)',
    };

    expect(detectExplainOutcomes(native).map(({ outcome }) => outcome)).toContain('sort:native');
    expect(detectExplainOutcomes(script).map(({ outcome }) => outcome)).toContain('sort:script');
    expect(detectExplainOutcomes(coordinator).map(({ outcome }) => outcome)).toContain(
      'sort:coordinator'
    );
  });

  it('fails closed for unknown tree fields and non-Calcite plans', () => {
    expect(
      detectExplainOutcomes({
        isCalcite: true,
        physicalTree: { rels: [{ relOp: 'FutureRel', PushDownContext: ['FAST_FILTER'] }] },
      })
    ).toEqual([]);
    expect(detectExplainOutcomes({ isCalcite: false })).toEqual([]);
  });
});
