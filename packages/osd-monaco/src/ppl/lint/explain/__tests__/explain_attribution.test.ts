/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import type { Diagnostic } from '../../diagnostic';
import type { ExplainOutcome } from '../explain_types';
import { createRuntimeRuleNameToIndex } from '../../rule_index';
import { wholeQueryRange } from '../../range_utils';
import { buildExplainAttributionSnapshot } from '../attribution/candidates';
import {
  createExplainAttributionState,
  ExplainAttributionInputs,
  runExplainIsolation,
} from '../explain_attribution';
import { explainCache } from '../explain_cache';

const ruleNameToIndex = createRuntimeRuleNameToIndex(
  new Map(SimplifiedOpenSearchPPLParser.ruleNames.map((name, index) => [name, index]))
);

const PLANS = {
  none: 'CalciteEnumerableIndexScan(table=[[logs]])',
  filterNative: 'CalciteEnumerableIndexScan(PushDownContext=[[FILTER->>($0, 1)]])',
  filterScript:
    'CalciteEnumerableIndexScan(PushDownContext=[[SCRIPT->>($0, 1)]], sourceBuilder=opensearch_compounded_script)',
  aggregationNative:
    'CalciteEnumerableIndexScan(PushDownContext=[[AGGREGATION->LogicalAggregate]])',
  aggregationCoordinator: 'EnumerableAggregate(input=CalciteEnumerableIndexScan)',
  sortNative: 'CalciteEnumerableIndexScan(PushDownContext=[[SORT->[bytes ASC]]])',
  sortScript:
    'CalciteEnumerableIndexScan(PushDownContext=[[SORT_EXPR->[x ASC]]], sourceBuilder=opensearch_compounded_script)',
} as const;

function buildTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

function operation(outcome: ExplainOutcome): 'filter' | 'aggregation' | 'sort' {
  return outcome.slice(0, outcome.indexOf(':')) as 'filter' | 'aggregation' | 'sort';
}

function diagnostic(query: string, outcome: ExplainOutcome): Diagnostic {
  return {
    ruleId: outcome.endsWith(':script') ? 'operation-pushed-as-script' : 'operation-not-pushed',
    severity: 'warning',
    message: 'slow',
    range: wholeQueryRange(query),
    hoverFacts: { operation: operation(outcome) },
    explainTarget: { operation: operation(outcome), outcome, fields: [] },
  };
}

function response(physical: string) {
  return { calcite: { logical: 'LogicalProject', physical } };
}

function makeInputs(
  query: string,
  outcome: ExplainOutcome,
  resolvePlan: (query: string) => string | Promise<string>,
  options: {
    typeMap?: Map<string, string>;
    isCurrent?: () => boolean;
    validateGeneratedQueries?: (queries: string[]) => Promise<boolean[]>;
  } = {}
): { inputs: ExplainAttributionInputs; http: { post: jest.Mock } } {
  const http = {
    post: jest.fn(async (_path: string, request: { body?: BodyInit | null }) => {
      const generated = JSON.parse(String(request.body)).query as string;
      return response(await resolvePlan(generated));
    }),
  };
  const inputs: ExplainAttributionInputs = {
    query,
    snapshot: buildExplainAttributionSnapshot(buildTree(query), ruleNameToIndex, query, {
      typeMap: options.typeMap,
    }),
    typeMap: options.typeMap,
    baselineDiagnostics: [diagnostic(query, outcome)],
    http,
    dataSourceId: 'ds-attribution',
    validateGeneratedQueries:
      options.validateGeneratedQueries ?? (async (queries) => queries.map(() => true)),
    isCurrent: options.isCurrent ?? (() => true),
  };
  return { inputs, http };
}

function sourceAt(query: string, result: Diagnostic): string {
  expect(result.range.startLine).toBe(1);
  expect(result.range.endLine).toBe(1);
  return query.slice(result.range.startColumn, result.range.endColumn);
}

describe('runExplainIsolation', () => {
  afterEach(() => {
    explainCache.clear();
  });

  it('marks only the scripted filter in a native/script pair', async () => {
    const query = 'source=logs | where bytes > 1 | where bytes - 1000 > 5000';
    const { inputs, http } = makeInputs(query, 'filter:script', (generated) => {
      if (generated.includes('bytes - 1000 > 5000')) {
        return PLANS.filterScript;
      }
      if (generated.includes('bytes > 1')) {
        return PLANS.filterNative;
      }
      return PLANS.none;
    });
    const state = createExplainAttributionState(inputs);

    expect(state.immediateDiagnostics).toEqual([]);
    const result = await runExplainIsolation(inputs, state);

    expect(result).toHaveLength(1);
    expect(sourceAt(query, result[0])).toBe('bytes - 1000 > 5000');
    expect(result[0].attribution?.confidence).toBe('causal-probe');
    expect(http.post).toHaveBeenCalledTimes(3);
  });

  it('emits two precise findings for independently scripted filters', async () => {
    const query = 'source=logs | where bytes - 1 > 2 | where latency + 5 > 10';
    const { inputs } = makeInputs(query, 'filter:script', (generated) =>
      generated.includes('bytes - 1 > 2') || generated.includes('latency + 5 > 10')
        ? PLANS.filterScript
        : PLANS.none
    );

    const result = await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(result.map((item) => sourceAt(query, item))).toEqual([
      'bytes - 1 > 2',
      'latency + 5 > 10',
    ]);
  });

  it('maps repeated identical scripted predicates to both original ranges', async () => {
    const query = 'source=logs | where bytes - 1 > 2 | where bytes - 1 > 2';
    const { inputs } = makeInputs(query, 'filter:script', (generated) =>
      generated.includes('bytes - 1 > 2') ? PLANS.filterScript : PLANS.none
    );

    const result = await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(result).toHaveLength(2);
    expect(result[0].range.startColumn).not.toBe(result[1].range.startColumn);
    expect(result.every((item) => sourceAt(query, item) === 'bytes - 1 > 2')).toBe(true);
  });

  it('marks only values(status) in a mixed coordinator/native aggregation', async () => {
    const query = 'source=logs | stats values(status), count() by host';
    const { inputs } = makeInputs(query, 'aggregation:coordinator', (generated) => {
      if (generated.includes('values(status)')) {
        return PLANS.aggregationCoordinator;
      }
      if (generated.includes('stats count()')) {
        return PLANS.aggregationNative;
      }
      return PLANS.none;
    });

    const result = await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(result).toHaveLength(1);
    expect(sourceAt(query, result[0])).toBe('values(status)');
  });

  it('moves a derived sort marker to its confirmed eval definition and retains the use', async () => {
    const query = 'source=logs | eval x = bytes + latency | sort bytes, x | head 10';
    const { inputs, http } = makeInputs(
      query,
      'sort:script',
      (generated) => {
        if (!generated.includes('| sort')) {
          return PLANS.none;
        }
        if (generated.includes('sort bytes')) {
          return PLANS.sortNative;
        }
        if (generated.includes('eval x = bytes | sort x')) {
          return PLANS.sortNative;
        }
        return PLANS.sortScript;
      },
      {
        typeMap: new Map([
          ['bytes', 'long'],
          ['latency', 'integer'],
        ]),
      }
    );

    const result = await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(result).toHaveLength(1);
    expect(sourceAt(query, result[0])).toBe('bytes + latency');
    expect(result[0].attribution?.relatedRanges).toHaveLength(1);
    const [related] = result[0].attribution!.relatedRanges!;
    expect(query.slice(related.startColumn, related.endColumn)).toBe('x');
    expect(http.post).toHaveBeenCalledTimes(4);
  });

  it('publishes a deterministic fix only after the rewritten treatment loses the outcome', async () => {
    const query = 'source=logs | where age - 2 > 30';
    const { inputs, http } = makeInputs(
      query,
      'filter:script',
      (generated) => (generated.includes('age > 32') ? PLANS.filterNative : PLANS.filterScript),
      { typeMap: new Map([['age', 'integer']]) }
    );
    const state = createExplainAttributionState(inputs);

    expect(state.immediateDiagnostics[0].fix).toBeUndefined();
    const [result] = await runExplainIsolation(inputs, state);

    expect(result.fix?.text).toBe('age > 32');
    expect(result.fix?.expectedText).toBe('age - 2 > 30');
    expect(http.post).toHaveBeenCalledTimes(1);
  });

  it('suppresses attribution when the control retains the outcome', async () => {
    const query = 'source=logs | where bytes - 1 > 2 | where latency + 5 > 10';
    const { inputs, http } = makeInputs(query, 'filter:script', () => PLANS.filterScript);

    const result = await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(result).toEqual([]);
    expect(http.post).toHaveBeenCalledTimes(1);
  });

  it('suppresses attribution on network error without caching it as an empty plan', async () => {
    const query = 'source=logs | where bytes - 1 > 2 | where latency + 5 > 10';
    const { inputs, http } = makeInputs(query, 'filter:script', () =>
      Promise.reject(new Error('network'))
    );

    const result = await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(result).toEqual([]);
    expect(http.post).toHaveBeenCalledTimes(1);
  });

  it('does not probe above the candidate cap', () => {
    const query =
      'source=logs | where a - 1 > 1 | where b - 1 > 1 | where c - 1 > 1 | where d - 1 > 1';
    const { inputs, http } = makeInputs(query, 'filter:script', () => PLANS.filterScript);
    const state = createExplainAttributionState(inputs);

    expect(state.immediateDiagnostics).toEqual([]);
    expect(state.needsIsolation).toBe(false);
    expect(http.post).not.toHaveBeenCalled();
  });

  it('stops publishing and issuing treatments when the lint generation changes', async () => {
    const query = 'source=logs | where bytes - 1 > 2 | where latency + 5 > 10';
    let current = true;
    const { inputs, http } = makeInputs(
      query,
      'filter:script',
      () => {
        current = false;
        return PLANS.none;
      },
      { isCurrent: () => current }
    );

    const result = await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(result).toEqual([]);
    expect(http.post).toHaveBeenCalledTimes(1);
  });

  it('batches control and treatments through validation before Explain', async () => {
    const query = 'source=logs | where bytes - 1 > 2 | where latency + 5 > 10';
    const validateGeneratedQueries = jest.fn(async (queries: string[]) => queries.map(() => true));
    const { inputs, http } = makeInputs(
      query,
      'filter:script',
      (generated) => (generated.includes('bytes - 1 > 2') ? PLANS.filterScript : PLANS.none),
      { validateGeneratedQueries }
    );

    await runExplainIsolation(inputs, createExplainAttributionState(inputs));

    expect(validateGeneratedQueries).toHaveBeenCalledTimes(1);
    expect(validateGeneratedQueries.mock.calls[0][0]).toHaveLength(3);
    expect(http.post).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['throw', async () => Promise.reject(new Error('worker failed'))],
    ['wrong length', async () => [true]],
    ['non boolean', async () => [true, true, 'yes'] as any],
    ['invalid query', async () => [true, false, true]],
  ])('fails closed when batch validation returns %s', async (_name, validator) => {
    const query = 'source=logs | where bytes - 1 > 2 | where latency + 5 > 10';
    const { inputs, http } = makeInputs(query, 'filter:script', () => PLANS.filterScript, {
      validateGeneratedQueries: validator,
    });

    await expect(
      runExplainIsolation(inputs, createExplainAttributionState(inputs))
    ).resolves.toEqual([]);
    expect(http.post).not.toHaveBeenCalled();
  });

  it('does not issue Explain after the model changes during validation', async () => {
    const query = 'source=logs | where bytes - 1 > 2 | where latency + 5 > 10';
    let current = true;
    const { inputs, http } = makeInputs(query, 'filter:script', () => PLANS.filterScript, {
      isCurrent: () => current,
      validateGeneratedQueries: async (queries) => {
        current = false;
        return queries.map(() => true);
      },
    });

    await expect(
      runExplainIsolation(inputs, createExplainAttributionState(inputs))
    ).resolves.toEqual([]);
    expect(http.post).not.toHaveBeenCalled();
  });
});
