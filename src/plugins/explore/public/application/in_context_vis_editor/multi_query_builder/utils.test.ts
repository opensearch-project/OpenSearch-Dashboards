/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getQueryLabel } from '../../../../../data/common';
import {
  computeAggregateStatus,
  getQueryLabelIndex,
  normalizeUrlEditorState,
  normalizeUrlQueries,
  resolveRawTableRefId,
  RowExecutionState,
  SeriesResult,
  toRowListItem,
  toSeriesResult,
  buildSingleQueryToList,
  toSavedQueries,
  parseSavedContainerState,
  getRowsMaxDataPoints,
} from './utils';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';

const pplQuery = { query: 'source = logs', language: 'PPL' };
const promQuery = { query: 'up', language: 'PROMQL' };

describe('normalizeUrlQueries', () => {
  it('returns [] for an empty value', () => {
    expect(normalizeUrlQueries(undefined)).toEqual([]);
    expect(normalizeUrlQueries(null)).toEqual([]);
  });

  it('keeps multi-query entries and their order', () => {
    expect(
      normalizeUrlQueries([
        ['B', promQuery],
        ['A', pplQuery],
      ])
    ).toEqual([
      ['B', promQuery],
      ['A', pplQuery],
    ]);
  });

  it('turns a single-query URL state into row A', () => {
    expect(normalizeUrlQueries(pplQuery)).toEqual([['A', pplQuery]]);
  });

  it('drops malformed entries', () => {
    expect(normalizeUrlQueries([['A', pplQuery], 'oops', [1, promQuery]])).toEqual([
      ['A', pplQuery],
    ]);
  });
});

describe('normalizeUrlEditorState', () => {
  it('returns no rows for an empty value', () => {
    expect(normalizeUrlEditorState(undefined)).toEqual({ rows: [] });
  });

  it('keeps multi-query editor state', () => {
    const state = {
      selectedRowRefId: 'B',
      maxDataPoints: 500,
      rows: [
        ['A', { languageType: 'PPL', isHidden: false }],
        ['B', { languageType: 'PROMQL', isHidden: true }],
      ],
    };
    expect(normalizeUrlEditorState(state)).toEqual(state);
  });

  it('turns a single-query editor state into row A', () => {
    expect(normalizeUrlEditorState({ languageType: 'PPL', isQueryEditorDirty: true })).toEqual({
      selectedRowRefId: 'A',

      rows: [['A', { isHidden: false }]],
    });
  });
});

describe('getQueryLabelIndex', () => {
  it('is the inverse of getQueryLabel', () => {
    [0, 1, 25, 26, 27, 51, 52].forEach((index) => {
      expect(getQueryLabelIndex(getQueryLabel(index))).toBe(index);
    });
  });

  it('returns -1 for a non-label refId', () => {
    expect(getQueryLabelIndex('custom')).toBe(-1);
    expect(getQueryLabelIndex('')).toBe(-1);
  });
});

const rowState = (
  refId: string,
  status: QueryExecutionStatus,
  result?: any,
  error?: any
): RowExecutionState => ({ refId, status: { status, error } as any, result });

describe('computeAggregateStatus', () => {
  const { LOADING, READY, ERROR, NO_RESULTS, UNINITIALIZED } = QueryExecutionStatus;

  it('is LOADING while a batch runs, whatever the rows say', () => {
    expect(computeAggregateStatus([rowState('A', READY)], true).status).toBe(LOADING);
  });

  it('is LOADING while any row loads', () => {
    expect(
      computeAggregateStatus([rowState('A', READY), rowState('B', LOADING)], false).status
    ).toBe(LOADING);
  });

  it('is UNINITIALIZED when no row ran, or there are no visible rows', () => {
    expect(computeAggregateStatus([rowState('A', UNINITIALIZED)], false).status).toBe(
      UNINITIALIZED
    );
    expect(computeAggregateStatus([], false).status).toBe(UNINITIALIZED);
  });

  it('is READY when any row has results, and lists the failed rows', () => {
    const error = { error: 'Bad Request' };
    const aggregate = computeAggregateStatus(
      [rowState('A', READY), rowState('B', ERROR, undefined, error), rowState('C', UNINITIALIZED)],
      false
    );
    expect(aggregate).toEqual({ status: READY, failedQueries: [{ refId: 'B', error }] });
  });

  it('is ERROR when nothing has results and a row failed', () => {
    expect(
      computeAggregateStatus([rowState('A', NO_RESULTS), rowState('B', ERROR)], false).status
    ).toBe(ERROR);
  });

  it('is NO_RESULTS when the rows that ran found nothing', () => {
    expect(
      computeAggregateStatus([rowState('A', NO_RESULTS), rowState('B', UNINITIALIZED)], false)
        .status
    ).toBe(NO_RESULTS);
  });
});

describe('toSeriesResult', () => {
  it("takes the row's hits, schema and series display names", () => {
    const hits = [{ _id: '1', _source: { value: 1 } }];
    const fieldSchema = [{ name: 'value', type: 'number' }];
    expect(
      toSeriesResult(
        rowState('B', QueryExecutionStatus.READY, {
          hits: { hits },
          fieldSchema,
          frameMeta: { seriesDisplayNames: { s: 'S' } },
        })
      )
    ).toEqual({ refId: 'B', rows: hits, fieldSchema, seriesDisplayNames: { s: 'S' } });
  });

  it('is empty without a result', () => {
    expect(toSeriesResult(rowState('A', QueryExecutionStatus.UNINITIALIZED))).toEqual({
      refId: 'A',
      rows: [],
      fieldSchema: [],
      seriesDisplayNames: undefined,
    });
  });
});

describe('toRowListItem', () => {
  it('marks hidden and failed rows', () => {
    expect(
      toRowListItem('A', {
        isHidden: true,
        queryStatus: { status: QueryExecutionStatus.ERROR },
      } as any)
    ).toEqual({ refId: 'A', isHidden: true, isValid: false });
    expect(
      toRowListItem('B', { queryStatus: { status: QueryExecutionStatus.READY } } as any)
    ).toEqual({ refId: 'B', isHidden: false, isValid: true });
  });
});

describe('resolveRawTableRefId', () => {
  const series = (refId: string) => ({ refId, rows: [], fieldSchema: [] }) as SeriesResult;

  it('keeps the chosen query while it has results', () => {
    expect(resolveRawTableRefId([series('A'), series('B')], 'B')).toBe('B');
  });

  it('falls back to the first query, or none', () => {
    expect(resolveRawTableRefId([series('A'), series('B')], 'C')).toBe('A');
    expect(resolveRawTableRefId([series('A')])).toBe('A');
    expect(resolveRawTableRefId([], 'A')).toBeUndefined();
  });
});

describe('buildSingleQueryToList', () => {
  it("reads a saved explore's single query as row A, keeping its max data points on it", () => {
    const query = { query: 'up', language: 'PROMQL', queryOptions: { maxDataPoints: 100 } } as any;
    expect(buildSingleQueryToList(query)).toEqual({
      queries: [['A', query]],

      editorState: { maxDataPoints: 100, rows: [] },
    });
  });

  it('is undefined without a query', () => {
    expect(buildSingleQueryToList(undefined)).toBeUndefined();
  });
});

describe('getRowsMaxDataPoints', () => {
  it("takes the first metrics row's max data points", () => {
    expect(
      getRowsMaxDataPoints([
        ['A', { query: 'x', language: 'PPL' }],
        ['B', { query: 'up', language: 'PROMQL', queryOptions: { maxDataPoints: 300 } }],
        ['C', { query: 'up', language: 'PROMQL', queryOptions: { maxDataPoints: 900 } }],
      ] as any)
    ).toBe(300);
  });

  it('is undefined when no row has one', () => {
    expect(getRowsMaxDataPoints([['A', { query: 'x', language: 'PPL' }]] as any)).toBeUndefined();
  });
});

describe('saved queries', () => {
  const ppl = (query: string) => ({ query, language: 'PPL' }) as any;
  const state = {
    queries: [
      ['A', ppl('a')],
      ['B', ppl('b')],
    ] as any,
    editorState: {
      selectedRowRefId: 'B',
      rows: [
        ['A', { isHidden: false }],
        ['B', { isHidden: true }],
      ] as any,
    },
  };

  it("puts each row's hidden state next to its query, and nothing else of the editor state", () => {
    expect(toSavedQueries(state)).toEqual([
      { refId: 'A', query: ppl('a') },
      { refId: 'B', query: ppl('b'), isHidden: true },
    ]);
  });

  it('reads them back into rows and their editor state', () => {
    expect(parseSavedContainerState(JSON.stringify(toSavedQueries(state)))).toEqual({
      queries: state.queries,
      editorState: { rows: state.editorState.rows },
    });
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['unparsable', '[not json'],
    ['not a list', JSON.stringify({ query: 'x' })],
    ['without rows', '[]'],
    ['only the old [refId, query] rows', JSON.stringify([['A', ppl('a')]])],
    [
      'the only row has a non-boolean isHidden',
      JSON.stringify([{ refId: 'A', query: ppl('a'), isHidden: 'true' }]),
    ],
  ])('is undefined when %s, so the legacy query is read', (_, raw) => {
    expect(parseSavedContainerState(raw)).toBeUndefined();
  });
});
