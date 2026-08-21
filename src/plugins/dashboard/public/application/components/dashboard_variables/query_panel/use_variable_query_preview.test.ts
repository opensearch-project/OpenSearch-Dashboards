/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { useVariableQueryPreview, UseVariableQueryPreviewArgs } from './use_variable_query_preview';
import { PromQLVariableQueryType } from '../../../../variables/types';

jest.mock('../../../../variables/variable_query_utils', () => ({
  ...jest.requireActual('../../../../variables/variable_query_utils'),
  executeVariableQuery: jest.fn(),
}));

jest.mock('../../../../variables/promql_variable_query_utils', () => ({
  ...jest.requireActual('../../../../variables/promql_variable_query_utils'),
  executePromQLResourceQuery: jest.fn(),
}));

import { executeVariableQuery } from '../../../../variables/variable_query_utils';
import { executePromQLResourceQuery } from '../../../../variables/promql_variable_query_utils';

const mockExecuteVariableQuery = executeVariableQuery as jest.Mock;
const mockExecutePromQLResourceQuery = executePromQLResourceQuery as jest.Mock;

function makeQueryResult(
  rows: Array<Record<string, unknown>>,
  fields: string[] = [],
  fieldTypes: Record<string, 'string' | 'number' | 'boolean'> = {}
) {
  return { rows, fields, fieldTypes };
}

const mockData: any = {
  query: { timefilter: { timefilter: { getTime: jest.fn().mockReturnValue(undefined) } } },
};

// NOTE: every call returns a *fresh* args object (new `dataset`/`promqlQueryType`
// object literals). This is intentional and required — `renderHook`'s callback re-runs
// on every render, so passing a freshly-built object as a *stable* local variable
// (computed once, outside the renderHook callback) is what keeps `dataset`/
// `promqlQueryType` referentially stable across re-renders. If callers instead
// call `defaultArgs(...)` *inside* the renderHook callback, a new object is created
// on every render, `useEffect(..., [query, dataset, language, promqlQueryType])`
// inside the hook sees the identity change, and it wipes out `queryResult` right
// after `handleRunQuery` sets it — silently discarding every Preview.
function defaultArgs(
  overrides: Partial<UseVariableQueryPreviewArgs> = {}
): UseVariableQueryPreviewArgs {
  return {
    data: mockData,
    query: 'source = logs',
    language: 'PPL',
    dataset: { id: 'ds-1' },
    useTimeFilter: false,
    valueField: '',
    labelField: '',
    regex: '',
    isPromqlFillInBlank: false,
    promqlQueryType: { kind: 'queryResult' } as PromQLVariableQueryType,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockExecuteVariableQuery.mockResolvedValue(makeQueryResult([]));
  mockExecutePromQLResourceQuery.mockResolvedValue([]);
});

describe('useVariableQueryPreview — free-text (PPL/SQL) branch', () => {
  it('reports no completed query and does not validate before Preview runs', () => {
    const args = defaultArgs();
    const { result } = renderHook(() => useVariableQueryPreview(args));

    // hasCompletedQuery starts false (queryResult === null) — Apply must stay blocked.
    expect(result.current.canApply).toBe(false);
  });

  it('allows Apply when the query succeeds with zero rows ("no results" is valid-but-empty)', async () => {
    mockExecuteVariableQuery.mockResolvedValue(makeQueryResult([]));
    const args = defaultArgs();
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(result.current.previewError).toBe('Query returned no results');
    expect(result.current.canApply).toBe(true);
  });

  it('allows Apply when the query succeeds and regex filters every option out', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }, { service: 'web' }], ['service'], {
        service: 'string',
      })
    );
    const args = defaultArgs({ regex: 'does-not-match-anything' });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(result.current.filteredPreviewOptions).toHaveLength(0);
    expect(result.current.previewError).toBe('No options match the regex');
    expect(result.current.canApply).toBe(true);
  });

  it('blocks Apply when rows are returned but no value field is available', async () => {
    // Rows with no fields at all -> no candidate value field.
    mockExecuteVariableQuery.mockResolvedValue(makeQueryResult([{}], [], {}));
    const args = defaultArgs();
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(result.current.previewError).toBe(
      'Query returned results, but no fields are available for variable values'
    );
    expect(result.current.canApply).toBe(false);
  });

  it('blocks Apply when the selected value field is not present in the results', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }], ['service'], { service: 'string' })
    );
    const args = defaultArgs({ valueField: 'does_not_exist' });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(result.current.previewError).toBe('Selected value field was not found in query results');
    expect(result.current.canApply).toBe(false);
  });

  it('blocks Apply when the selected value field has no scalar values', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ nested: { a: 1 } }], ['nested'], {})
    );
    const args = defaultArgs({ valueField: 'nested' });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(result.current.previewError).toBe(
      'Query returned results, but the selected value field does not contain string, number, or boolean values'
    );
    expect(result.current.canApply).toBe(false);
  });

  it('allows Apply and reports no error when the query returns usable options', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }, { service: 'web' }], ['service'], {
        service: 'string',
      })
    );
    const args = defaultArgs();
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(result.current.previewError).toBeNull();
    expect(result.current.filteredPreviewOptions).toHaveLength(2);
    expect(result.current.canApply).toBe(true);
  });

  it('blocks Apply on a network/execution error', async () => {
    mockExecuteVariableQuery.mockRejectedValue(new Error('boom'));
    const args = defaultArgs();
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(result.current.previewError).toBe('boom');
    expect(result.current.canApply).toBe(false);
  });

  it('blocks Apply with an "empty query" error and does not call executeVariableQuery', async () => {
    const args = defaultArgs({ query: '   ' });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunQuery();
    });

    expect(mockExecuteVariableQuery).not.toHaveBeenCalled();
    expect(result.current.previewError).toBe('Query is empty');
    expect(result.current.canApply).toBe(false);
  });

  it('re-derives isPreviewValid from valueField changes without a network re-fetch', async () => {
    // Regression test: switching valueField/labelField/regex is a pure client-side
    // re-derivation of the already-fetched queryResult — no new executeVariableQuery
    // call should be needed, and Apply should remain valid throughout.
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult(
        [
          { service: 'api', agent: 'chrome' },
          { service: 'web', agent: 'firefox' },
        ],
        ['service', 'agent'],
        { service: 'string', agent: 'string' }
      )
    );
    const stableDataset = { id: 'ds-1' };
    const stablePromqlQueryType: PromQLVariableQueryType = { kind: 'queryResult' };
    const { result, rerender } = renderHook(
      (props: UseVariableQueryPreviewArgs) => useVariableQueryPreview(props),
      {
        initialProps: defaultArgs({
          dataset: stableDataset,
          promqlQueryType: stablePromqlQueryType,
          valueField: 'service',
        }),
      }
    );

    await act(async () => {
      await result.current.handleRunQuery();
    });
    expect(result.current.canApply).toBe(true);
    expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);

    rerender(
      defaultArgs({
        dataset: stableDataset,
        promqlQueryType: stablePromqlQueryType,
        valueField: 'agent',
      })
    );

    // Still valid, and still only one network call — the switch was purely local.
    expect(result.current.canApply).toBe(true);
    expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
    expect(result.current.selectedValueField).toBe('agent');
  });

  it('resets to not-yet-run when the query text changes, requiring a fresh Preview', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }], ['service'], { service: 'string' })
    );
    const stableDataset = { id: 'ds-1' };
    const stablePromqlQueryType: PromQLVariableQueryType = { kind: 'queryResult' };
    const { result, rerender } = renderHook(
      (props: UseVariableQueryPreviewArgs) => useVariableQueryPreview(props),
      {
        initialProps: defaultArgs({
          dataset: stableDataset,
          promqlQueryType: stablePromqlQueryType,
        }),
      }
    );

    await act(async () => {
      await result.current.handleRunQuery();
    });
    expect(result.current.canApply).toBe(true);

    rerender(
      defaultArgs({
        dataset: stableDataset,
        promqlQueryType: stablePromqlQueryType,
        query: 'source = a_different_index',
      })
    );

    expect(result.current.canApply).toBe(false);
    expect(result.current.previewOptions).toHaveLength(0);
  });
});

describe('useVariableQueryPreview — PromQL fill-in-the-blank branch', () => {
  const labelValuesQueryType: PromQLVariableQueryType = {
    kind: 'labelValues',
    label: 'job',
  };

  it('allows Apply when the PromQL query succeeds with zero results', async () => {
    mockExecutePromQLResourceQuery.mockResolvedValue([]);
    const args = defaultArgs({
      isPromqlFillInBlank: true,
      promqlQueryType: labelValuesQueryType,
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(result.current.previewError).toBe('Query returned no results');
    expect(result.current.canApply).toBe(true);
  });

  it('allows Apply when the PromQL query succeeds and regex filters every option out', async () => {
    mockExecutePromQLResourceQuery.mockResolvedValue(['prometheus', 'node']);
    const args = defaultArgs({
      isPromqlFillInBlank: true,
      promqlQueryType: labelValuesQueryType,
      regex: 'does-not-match-anything',
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(result.current.filteredPreviewOptions).toHaveLength(0);
    expect(result.current.previewError).toBe('No options match the regex');
    expect(result.current.canApply).toBe(true);
  });

  it('allows Apply and reports no error when the PromQL query returns usable options', async () => {
    mockExecutePromQLResourceQuery.mockResolvedValue(['prometheus', 'node']);
    const args = defaultArgs({
      isPromqlFillInBlank: true,
      promqlQueryType: labelValuesQueryType,
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(result.current.previewError).toBeNull();
    expect(result.current.filteredPreviewOptions).toHaveLength(2);
    expect(result.current.canApply).toBe(true);
  });

  it('blocks Apply and does not call the network when Label is empty', async () => {
    const args = defaultArgs({
      isPromqlFillInBlank: true,
      promqlQueryType: { kind: 'labelValues', label: '' },
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(mockExecutePromQLResourceQuery).not.toHaveBeenCalled();
    expect(result.current.previewError).toBe('Label is required');
    expect(result.current.canApply).toBe(false);
  });

  it('blocks Apply and does not call the network for a negative-only label selector', async () => {
    const args = defaultArgs({
      isPromqlFillInBlank: true,
      promqlQueryType: {
        kind: 'labelValues',
        label: 'job',
        matchers: [{ label: 'job', operator: '!=', value: 'prometheus' }],
      },
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(mockExecutePromQLResourceQuery).not.toHaveBeenCalled();
    expect(result.current.previewError).toContain('is not valid in PromQL');
    expect(result.current.canApply).toBe(false);
  });

  it('blocks Apply and does not call the network when the Series matcher is empty', async () => {
    const args = defaultArgs({
      isPromqlFillInBlank: true,
      promqlQueryType: { kind: 'series', matcher: '' },
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(mockExecutePromQLResourceQuery).not.toHaveBeenCalled();
    expect(result.current.previewError).toBe('Series selector is required');
    expect(result.current.canApply).toBe(false);
  });

  it('blocks Apply on a network/execution error', async () => {
    mockExecutePromQLResourceQuery.mockRejectedValue(new Error('prometheus unreachable'));
    const args = defaultArgs({
      isPromqlFillInBlank: true,
      promqlQueryType: labelValuesQueryType,
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(result.current.previewError).toBe('prometheus unreachable');
    expect(result.current.canApply).toBe(false);
  });

  it('is a no-op for the "queryResult" (raw PromQL) kind', async () => {
    const args = defaultArgs({
      isPromqlFillInBlank: false,
      promqlQueryType: { kind: 'queryResult' },
    });
    const { result } = renderHook(() => useVariableQueryPreview(args));

    await act(async () => {
      await result.current.handleRunPromqlResourceQuery();
    });

    expect(mockExecutePromQLResourceQuery).not.toHaveBeenCalled();
  });
});
