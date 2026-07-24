/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogEntry } from '../../types';
import { ExplainPlan, ExplainRelTree } from '../explain_types';
import { operationNotPushedDetector } from '../rules/operation_not_pushed';
import { operationPushedAsScriptDetector } from '../rules/operation_pushed_as_script';

import aggNotPushedValues from '../__fixtures__/agg_not_pushed_values.json';
import deepPipe from '../__fixtures__/deep_pipe.json';
import evalDivScript from '../__fixtures__/eval_div_script.json';
import filterNotPushedWindow from '../__fixtures__/filter_not_pushed_window.json';
import filterPushed from '../__fixtures__/filter_pushed.json';
import filterScript from '../__fixtures__/filter_script.json';
import sortEval from '../__fixtures__/sort_eval.json';
import statsAgg from '../__fixtures__/stats_agg.json';

interface CalcitePayload {
  calcite: { logical: string; physical: string };
}

function toTextPlan(payload: CalcitePayload): ExplainPlan {
  return {
    isCalcite: true,
    physicalText: payload.calcite.physical,
    logicalText: payload.calcite.logical,
  };
}

function toTreePlan(
  physicalTree: ExplainRelTree,
  logicalTree: ExplainRelTree = { rels: [] }
): ExplainPlan {
  return { isCalcite: true, physicalTree, logicalTree };
}

const NOT_PUSHED_CONFIG: CatalogEntry = {
  id: 'operation-not-pushed',
  detector: 'operation-not-pushed',
  enabled: true,
  severity: 'warning',
  message: 'fallback',
  docUrl: 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/',
  appliesTo: { minVersion: '3.3.0', engine: 'calcite' },
};

const PUSHED_AS_SCRIPT_CONFIG: CatalogEntry = {
  id: 'operation-pushed-as-script',
  detector: 'operation-pushed-as-script',
  enabled: true,
  severity: 'info',
  message: 'fallback',
  docUrl: 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/',
  appliesTo: { minVersion: '3.3.0', engine: 'calcite' },
};

// query text is only used to size the whole-query range; any string works here.
const CTX = { query: 'source=accounts | head 1' };

const TREE_FIXTURES: Record<string, ExplainPlan> = {
  filterPushed: toTreePlan({
    rels: [
      {
        id: '1',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['PROJECT->[age]', 'FILTER->>($0, 30)', 'LIMIT->10000'],
        sourceBuilder: { query: { range: { age: { from: 30 } } } },
      },
    ],
  }),
  statsAgg: toTreePlan({
    rels: [
      {
        id: '2',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['AGGREGATION->rel#1:LogicalAggregate', 'PROJECT->[avg(age), state]'],
        sourceBuilder: { aggregations: { composite_buckets: {} } },
      },
    ],
  }),
  deepPipe: toTreePlan({
    rels: [
      { id: '3', relOp: 'CalciteEnumerableTopK' },
      {
        id: '4',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['FILTER->>($2, 20)', 'AGGREGATION->rel#2:LogicalAggregate'],
        // Guard: sourceBuilder can contain this token for non-script-push internals.
        sourceBuilder: { aggregations: { scripted_bucket: 'opensearch_compounded_script' } },
      },
    ],
  }),
  filterScript: toTreePlan({
    rels: [
      {
        id: '5',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['PROJECT->[firstname, age]', 'SCRIPT->>(-($1, 2), 30)', 'LIMIT->10000'],
        sourceBuilder: {
          query: { script: { script: { lang: 'opensearch_compounded_script' } } },
        },
      },
    ],
  }),
  evalDivScript: toTreePlan({
    rels: [
      { id: '6', relOp: 'EnumerableCalc' },
      {
        id: '7',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['PROJECT->[balance, age]', 'SCRIPT->>(DIVIDE($0, $1), 100)'],
        sourceBuilder: {
          query: { script: { script: { lang: 'opensearch_compounded_script' } } },
        },
      },
    ],
  }),
  sortEval: toTreePlan({
    rels: [
      { id: '8', relOp: 'EnumerableCalc' },
      {
        id: '9',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['PROJECT->[age, balance]', 'SORT_EXPR->[+($0, $1) ASCENDING]'],
        sourceBuilder: {
          sort: [{ _script: { script: { lang: 'opensearch_compounded_script' } } }],
        },
      },
    ],
  }),
  filterNotPushedWindow: toTreePlan({
    rels: [
      { id: '10', relOp: 'EnumerableLimit' },
      { id: '11', relOp: 'EnumerableCalc', $condition: '[$t5]' },
      { id: '12', relOp: 'EnumerableWindow' },
      {
        id: '13',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['PROJECT->[balance]'],
        sourceBuilder: { _source: { includes: ['balance'] } },
      },
    ],
  }),
  aggNotPushedValues: toTreePlan({
    rels: [
      { id: '14', relOp: 'EnumerableLimit' },
      { id: '15', relOp: 'EnumerableAggregate' },
      {
        id: '16',
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['PROJECT->[state]'],
        sourceBuilder: { _source: { includes: ['state'] } },
      },
    ],
  }),
};

// The truth table from design §6.10, verified against legacy engine payloads and
// mirrored with inline json_tree fixtures while the local cluster lacks
// `format=json_tree` support.
const FIXTURES: Array<{
  name: string;
  plan: ExplainPlan;
  notPushed: boolean;
  pushedAsScript: boolean;
}> = [
  {
    name: 'string filter_pushed (where age > 30)',
    plan: toTextPlan(filterPushed),
    notPushed: false,
    pushedAsScript: false,
  },
  {
    name: 'tree filter_pushed (where age > 30)',
    plan: TREE_FIXTURES.filterPushed,
    notPushed: false,
    pushedAsScript: false,
  },
  {
    name: 'string stats_agg (stats avg(age) by state)',
    plan: toTextPlan(statsAgg),
    notPushed: false,
    pushedAsScript: false,
  },
  {
    name: 'tree stats_agg (stats avg(age) by state)',
    plan: TREE_FIXTURES.statsAgg,
    notPushed: false,
    pushedAsScript: false,
  },
  {
    name: 'string deep_pipe (8-stage, all native)',
    plan: toTextPlan(deepPipe),
    notPushed: false,
    pushedAsScript: false,
  },
  {
    name: 'tree deep_pipe (8-stage, all native)',
    plan: TREE_FIXTURES.deepPipe,
    notPushed: false,
    pushedAsScript: false,
  },
  {
    name: 'string filter_script (where age - 2 > 30)',
    plan: toTextPlan(filterScript),
    notPushed: false,
    pushedAsScript: true,
  },
  {
    name: 'tree filter_script (where age - 2 > 30)',
    plan: TREE_FIXTURES.filterScript,
    notPushed: false,
    pushedAsScript: true,
  },
  {
    name: 'string eval_div_script (eval r=balance/age | where r>100)',
    plan: toTextPlan(evalDivScript),
    notPushed: false,
    pushedAsScript: true,
  },
  {
    name: 'tree eval_div_script (eval r=balance/age | where r>100)',
    plan: TREE_FIXTURES.evalDivScript,
    notPushed: false,
    pushedAsScript: true,
  },
  {
    name: 'string sort_eval (eval x=age+balance | sort x)',
    plan: toTextPlan(sortEval),
    notPushed: false,
    pushedAsScript: true,
  },
  {
    name: 'tree sort_eval (eval x=age+balance | sort x)',
    plan: TREE_FIXTURES.sortEval,
    notPushed: false,
    pushedAsScript: true,
  },
  {
    name: 'string filter_not_pushed_window (eventstats avg | where)',
    plan: toTextPlan(filterNotPushedWindow),
    notPushed: true,
    pushedAsScript: false,
  },
  {
    name: 'tree filter_not_pushed_window (eventstats avg | where)',
    plan: TREE_FIXTURES.filterNotPushedWindow,
    notPushed: true,
    pushedAsScript: false,
  },
  {
    name: 'string agg_not_pushed_values (stats values(state))',
    plan: toTextPlan(aggNotPushedValues),
    notPushed: true,
    pushedAsScript: false,
  },
  {
    name: 'tree agg_not_pushed_values (stats values(state))',
    plan: TREE_FIXTURES.aggNotPushedValues,
    notPushed: true,
    pushedAsScript: false,
  },
];

describe('explain detectors against captured and json_tree payloads', () => {
  describe.each(FIXTURES)('$name', ({ plan, notPushed, pushedAsScript }) => {
    it(`operation-not-pushed ${notPushed ? 'fires' : 'stays silent'}`, () => {
      const diagnostics = operationNotPushedDetector(plan, NOT_PUSHED_CONFIG, CTX);
      expect(diagnostics.length > 0).toBe(notPushed);
      diagnostics.forEach((d) => expect(d.ruleId).toBe('operation-not-pushed'));
    });

    it(`operation-pushed-as-script ${pushedAsScript ? 'fires' : 'stays silent'}`, () => {
      const diagnostics = operationPushedAsScriptDetector(plan, PUSHED_AS_SCRIPT_CONFIG, CTX);
      expect(diagnostics.length > 0).toBe(pushedAsScript);
      diagnostics.forEach((d) => expect(d.ruleId).toBe('operation-pushed-as-script'));
    });
  });

  it('the two rules are mutually exclusive for every payload', () => {
    for (const { plan } of FIXTURES) {
      const a = operationNotPushedDetector(plan, NOT_PUSHED_CONFIG, CTX).length > 0;
      const b = operationPushedAsScriptDetector(plan, PUSHED_AS_SCRIPT_CONFIG, CTX).length > 0;
      expect(a && b).toBe(false);
    }
  });

  it('both detectors no-op when the plan is not Calcite', () => {
    const nonCalcite: ExplainPlan = { isCalcite: false };
    expect(operationNotPushedDetector(nonCalcite, NOT_PUSHED_CONFIG, CTX)).toEqual([]);
    expect(operationPushedAsScriptDetector(nonCalcite, PUSHED_AS_SCRIPT_CONFIG, CTX)).toEqual([]);
  });

  it('emits a plain-language, operation-named message and a whole-query range', () => {
    const [diag] = operationNotPushedDetector(TREE_FIXTURES.aggNotPushedValues, NOT_PUSHED_CONFIG, {
      query: 'source=accounts | stats values(state)',
    });
    expect(diag.message).toContain('aggregation');
    // Leads with the user-visible consequence, no engine-internal jargon inline.
    expect(diag.message).not.toContain('coordinator');
    expect(diag.message).not.toContain('pushed');
    // Whole-query range by default (the tree-aware resolver narrows it later):
    // starts at line 1 col 0, ends at a concrete in-bounds col.
    expect(diag.range.startLine).toBe(1);
    expect(diag.range.startColumn).toBe(0);
    expect(diag.range.endColumn).toBe('source=accounts | stats values(state)'.length);
    expect(Number.isFinite(diag.range.endColumn)).toBe(true);
  });

  it('tags each finding with hoverFacts.operation and an explainTarget', () => {
    const [notPushed] = operationNotPushedDetector(
      TREE_FIXTURES.filterNotPushedWindow,
      NOT_PUSHED_CONFIG,
      CTX
    );
    expect(notPushed.hoverFacts?.operation).toBe('filter');
    expect(notPushed.explainTarget).toEqual({
      operation: 'filter',
      outcome: 'filter:coordinator',
      fields: [],
    });

    const [aggNotPushed] = operationNotPushedDetector(
      TREE_FIXTURES.aggNotPushedValues,
      NOT_PUSHED_CONFIG,
      CTX
    );
    expect(aggNotPushed.hoverFacts?.operation).toBe('aggregation');
    expect(aggNotPushed.explainTarget?.operation).toBe('aggregation');

    const [script] = operationPushedAsScriptDetector(
      TREE_FIXTURES.filterScript,
      PUSHED_AS_SCRIPT_CONFIG,
      CTX
    );
    expect(script.hoverFacts?.operation).toBe('filter');
    expect(script.explainTarget?.operation).toBe('filter');

    const [sortScript] = operationPushedAsScriptDetector(
      TREE_FIXTURES.sortEval,
      PUSHED_AS_SCRIPT_CONFIG,
      CTX
    );
    expect(sortScript.hoverFacts?.operation).toBe('sort');
    expect(sortScript.explainTarget?.operation).toBe('sort');
  });
});

// Fixture-drift canary: if an engine upgrade changes the plan vocabulary, this
// fails loudly before the legacy fallback rules silently stop firing (design §7).
describe('legacy fixture-drift canary', () => {
  it('filter_pushed still carries a native FILTER-> push tag', () => {
    expect(filterPushed.calcite.physical).toContain('FILTER->');
  });
  it('stats_agg still carries a native AGGREGATION-> push tag', () => {
    expect(statsAgg.calcite.physical).toContain('AGGREGATION->');
  });
  it('filter_script still carries SCRIPT-> + opensearch_compounded_script', () => {
    expect(filterScript.calcite.physical).toContain('SCRIPT->');
    expect(filterScript.calcite.physical).toContain('opensearch_compounded_script');
  });
  it('sort_eval still carries SORT_EXPR-> + opensearch_compounded_script', () => {
    expect(sortEval.calcite.physical).toContain('SORT_EXPR->');
    expect(sortEval.calcite.physical).toContain('opensearch_compounded_script');
  });
  it('filter_not_pushed_window still carries a residual $condition= with no push tag', () => {
    expect(filterNotPushedWindow.calcite.physical).toContain('$condition=');
    expect(filterNotPushedWindow.calcite.physical).not.toContain('FILTER->');
    expect(filterNotPushedWindow.calcite.physical).not.toContain('SCRIPT->');
  });
  it('agg_not_pushed_values still carries a residual EnumerableAggregate with no AGGREGATION->', () => {
    expect(aggNotPushedValues.calcite.physical).toContain('EnumerableAggregate');
    expect(aggNotPushedValues.calcite.physical).not.toContain('AGGREGATION->');
  });
  it('deep_pipe carries opensearch_compounded_script but no SCRIPT->/SORT_EXPR-> (no false positive)', () => {
    expect(deepPipe.calcite.physical).toContain('opensearch_compounded_script');
    expect(deepPipe.calcite.physical).not.toContain('SCRIPT->');
    expect(deepPipe.calcite.physical).not.toContain('SORT_EXPR->');
  });
});

describe('json_tree fixture canary', () => {
  it('physical tree exposes rels with relOp fields', () => {
    expect(TREE_FIXTURES.filterPushed.physicalTree?.rels).toEqual(
      expect.arrayContaining([expect.objectContaining({ relOp: 'CalciteEnumerableIndexScan' })])
    );
  });

  it('pushed examples expose PushDownContext and sourceBuilder fields', () => {
    expect(TREE_FIXTURES.filterScript.physicalTree?.rels?.[0]).toEqual(
      expect.objectContaining({
        PushDownContext: expect.arrayContaining([expect.stringContaining('SCRIPT->')]),
        sourceBuilder: expect.any(Object),
      })
    );
  });

  it('residual filter examples expose a condition field without filter/script pushdown', () => {
    expect(TREE_FIXTURES.filterNotPushedWindow.physicalTree?.rels).toEqual(
      expect.arrayContaining([expect.objectContaining({ relOp: 'EnumerableCalc' })])
    );
    const text = JSON.stringify(TREE_FIXTURES.filterNotPushedWindow.physicalTree);
    expect(text).toContain('$condition');
    expect(text).not.toContain('FILTER->');
    expect(text).not.toContain('SCRIPT->');
  });
});
