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

  it('keeps legacy text evidence line-local so a pushed filter cannot mask a residual filter', () => {
    // Partial pushdown (e.g. `where age > 30 | eventstats ... | where balance > ab`):
    // the scan line carries FILTER-> while a downstream Calc line carries a
    // residual $condition. Plan-wide matching would suppress the coordinator
    // signal; per-line matching must surface both.
    const plan: ExplainPlan = {
      isCalcite: true,
      physicalText:
        'EnumerableLimit(fetch=[10000])\n' +
        '  EnumerableCalc(expr#0..2=[{inputs}], balance=[$t0], $condition=[$t5])\n' +
        '    CalciteEnumerableIndexScan(table=[[OpenSearch, accounts]], PushDownContext=[[FILTER->>($0, 30)]])\n',
    };

    const outcomes = detectExplainOutcomes(plan).map(({ outcome }) => outcome);
    expect(outcomes).toContain('filter:native');
    expect(outcomes).toContain('filter:coordinator');
  });

  it('does not read a join condition as a residual filter (tree and legacy)', () => {
    // Calcite join rels serialize their join predicate as a `condition`
    // attribute; a join condition always evaluates at the coordinator by design
    // and is not a filter that failed to push down.
    const tree: ExplainPlan = {
      isCalcite: true,
      physicalTree: {
        rels: [
          {
            id: 'join',
            relOp: 'EnumerableHashJoin',
            condition: { op: '=', operands: [0, 1] },
            joinType: 'inner',
          },
        ],
      },
    };
    const legacy: ExplainPlan = {
      isCalcite: true,
      physicalText: 'EnumerableHashJoin(condition=[=($0, $1)], joinType=[inner])',
    };

    expect(detectExplainOutcomes(tree).map(({ outcome }) => outcome)).not.toContain(
      'filter:coordinator'
    );
    expect(detectExplainOutcomes(legacy).map(({ outcome }) => outcome)).not.toContain(
      'filter:coordinator'
    );
  });

  it('anchors coordinator sort/aggregation on the relOp suffix, not a substring', () => {
    // EnumerableSortMergeJoin is a join, not a sort: a substring match on
    // 'EnumerableSort' would misfire on it. EnumerableSortedAggregate IS a
    // coordinator aggregate: a substring match on 'EnumerableAggregate' would
    // miss it.
    const sortMergeJoin: ExplainPlan = {
      isCalcite: true,
      physicalTree: { rels: [{ relOp: 'EnumerableSortMergeJoin' }] },
    };
    const sortedAggregate: ExplainPlan = {
      isCalcite: true,
      physicalTree: { rels: [{ relOp: 'EnumerableSortedAggregate' }] },
    };

    expect(detectExplainOutcomes(sortMergeJoin).map(({ outcome }) => outcome)).not.toContain(
      'sort:coordinator'
    );
    expect(detectExplainOutcomes(sortedAggregate).map(({ outcome }) => outcome)).toContain(
      'aggregation:coordinator'
    );
  });
});
