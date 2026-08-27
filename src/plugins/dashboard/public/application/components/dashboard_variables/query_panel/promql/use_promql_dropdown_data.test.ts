/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { getPromQLResourceClient } from '../../../../../variables/promql_variable_query_utils';
import { PromQLResourceQuery } from '../../../../../variables/types';
import { usePromqlDropdownData, UsePromqlDropdownDataArgs } from './use_promql_dropdown_data';

jest.mock('../../../../../variables/promql_variable_query_utils', () => ({
  ...jest.requireActual('../../../../../variables/promql_variable_query_utils'),
  getPromQLResourceClient: jest.fn(),
}));

const mockGetPromQLResourceClient = getPromQLResourceClient as jest.Mock;

/** A resource client stub whose method resolutions can be inspected/controlled per test. */
function makeClient(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    getLabels: jest.fn().mockResolvedValue([]),
    getMetrics: jest.fn().mockResolvedValue([]),
    getLabelValues: jest.fn().mockResolvedValue([]),
    getMetricMetadata: jest.fn().mockResolvedValue({}),
    getSeries: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const dataStub = {
  query: {
    timefilter: { timefilter: { getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })) } },
  },
} as any;

function labelValuesQuery(
  overrides: Partial<Extract<PromQLResourceQuery, { kind: 'labelValues' }>> = {}
): PromQLResourceQuery {
  return { kind: 'labelValues', label: 'instance', ...overrides };
}

function baseArgs(overrides: Partial<UsePromqlDropdownDataArgs> = {}): UsePromqlDropdownDataArgs {
  return {
    data: dataStub,
    dataset: { id: 'ds-1', title: 'ds-1', type: 'PROMETHEUS' } as any,
    useTimeFilter: false,
    isPrometheusResource: true,
    promQLResourceQuery: labelValuesQuery(),
    ...overrides,
  };
}

// Let pending resource-client promises settle inside act().
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

describe('usePromqlDropdownData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPromQLResourceClient.mockReturnValue(makeClient());
  });

  it('does not fetch any dropdown data on mount (all lazy)', async () => {
    const client = makeClient({
      getLabels: jest.fn().mockResolvedValue(['instance', 'job']),
      getMetrics: jest.fn().mockResolvedValue(['up', 'node_cpu']),
    });
    mockGetPromQLResourceClient.mockReturnValue(client);

    const { result } = renderHook(() => usePromqlDropdownData(baseArgs()));
    await flush();

    expect(client.getMetrics).not.toHaveBeenCalled();
    expect(client.getLabels).not.toHaveBeenCalled();
    expect(result.current.promqlMetricNameOptions).toEqual([]);
    expect(result.current.promqlLabelNameOptions).toEqual([]);
  });

  it('loads metric names lazily when the metric dropdown is opened', async () => {
    const getMetrics = jest.fn().mockResolvedValue(['up', 'node_cpu']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getMetrics }));

    const { result } = renderHook(() => usePromqlDropdownData(baseArgs()));
    await flush();
    expect(getMetrics).not.toHaveBeenCalled(); // lazy

    await act(async () => {
      result.current.loadMetricNames();
    });
    await flush();

    expect(getMetrics).toHaveBeenCalledWith('ds-1', undefined, undefined);
    expect(result.current.promqlMetricNameOptions).toEqual(['up', 'node_cpu']);

    // Reopening — served from the per-dataset cache, no new fetch.
    await act(async () => {
      result.current.loadMetricNames();
    });
    await flush();
    expect(getMetrics).toHaveBeenCalledTimes(1);
  });

  it('loads label names lazily and scopes them to the selected metric', async () => {
    const getLabels = jest.fn().mockResolvedValue(['cpu', 'mode', 'instance']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabels }));

    const { result } = renderHook(() =>
      usePromqlDropdownData(
        baseArgs({ promQLResourceQuery: labelValuesQuery({ metric: 'node_cpu' }) })
      )
    );
    await flush();
    expect(getLabels).not.toHaveBeenCalled(); // lazy

    // Opening a label dropdown triggers the fetch, scoped to the metric.
    await act(async () => {
      result.current.loadLabelNames();
    });
    await flush();

    expect(getLabels).toHaveBeenCalledWith('ds-1', undefined, '{__name__="node_cpu"}', undefined);
    expect(result.current.promqlLabelNameOptions).toEqual(['cpu', 'mode', 'instance']);
  });

  it('passes no metric selector for label names when no metric is selected', async () => {
    const getLabels = jest.fn().mockResolvedValue(['a']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabels }));

    const { result } = renderHook(() => usePromqlDropdownData(baseArgs()));
    await act(async () => {
      result.current.loadLabelNames();
    });
    await flush();

    expect(getLabels).toHaveBeenCalledWith('ds-1', undefined, undefined, undefined);
  });

  it('refetches label names when the selected metric changes', async () => {
    const getLabels = jest.fn().mockResolvedValue(['a']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabels }));

    const { result, rerender } = renderHook(
      (p: UsePromqlDropdownDataArgs) => usePromqlDropdownData(p),
      { initialProps: baseArgs({ promQLResourceQuery: labelValuesQuery({ metric: 'node_cpu' }) }) }
    );
    await act(async () => {
      result.current.loadLabelNames();
    });
    await flush();
    const callsAfterFirst = getLabels.mock.calls.length;

    // Change metric — cache invalidated, reopening refetches with the new scope.
    rerender(baseArgs({ promQLResourceQuery: labelValuesQuery({ metric: 'node_memory' }) }));
    await flush();
    await act(async () => {
      result.current.loadLabelNames();
    });
    await flush();

    expect(getLabels.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    expect(getLabels).toHaveBeenLastCalledWith(
      'ds-1',
      undefined,
      '{__name__="node_memory"}',
      undefined
    );
  });

  it('discards an in-flight label-name result whose metric changed before it resolved', async () => {
    // First request (metric node_cpu) is deferred so it can resolve AFTER the
    // metric has already changed to node_memory.
    let resolveFirst: (labels: string[]) => void = () => {};
    const getLabels = jest
      .fn()
      .mockImplementationOnce(() => new Promise<string[]>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue(['mem_label']); // second (node_memory) request

    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabels }));

    const { result, rerender } = renderHook(
      (p: UsePromqlDropdownDataArgs) => usePromqlDropdownData(p),
      { initialProps: baseArgs({ promQLResourceQuery: labelValuesQuery({ metric: 'node_cpu' }) }) }
    );

    // Open dropdown under node_cpu — first request is now in flight.
    await act(async () => {
      result.current.loadLabelNames();
    });

    // Change metric to node_memory, then load again (fresh request resolves).
    rerender(baseArgs({ promQLResourceQuery: labelValuesQuery({ metric: 'node_memory' }) }));
    await act(async () => {
      result.current.loadLabelNames();
    });
    await flush();

    // Now let the STALE node_cpu request resolve out of order.
    await act(async () => {
      resolveFirst(['cpu_label']);
      await Promise.resolve();
    });

    // The stale result must NOT be shown; only the node_memory result stands.
    expect(result.current.promqlLabelNameOptions).toEqual(['mem_label']);
  });

  it('does NOT fetch matcher values until the row dropdown is opened (lazy)', async () => {
    const getLabelValues = jest.fn().mockResolvedValue(['a']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const { result } = renderHook(() =>
      usePromqlDropdownData(
        baseArgs({
          promQLResourceQuery: labelValuesQuery({
            matchers: [{ label: 'instance', operator: '=', value: '' }],
          }),
        })
      )
    );
    await flush();

    // No proactive fetch on mount.
    expect(getLabelValues).not.toHaveBeenCalled();

    // Opening the row's dropdown triggers the fetch.
    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();

    expect(getLabelValues).toHaveBeenCalledTimes(1);
    expect(result.current.getMatcherValueOptions(0)).toEqual(['a']);
  });

  it('scopes the value lookup by metric + sibling matchers (excluding the row itself)', async () => {
    const getLabelValues = jest.fn().mockResolvedValue(['a', 'b']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const { result } = renderHook(() =>
      usePromqlDropdownData(
        baseArgs({
          promQLResourceQuery: labelValuesQuery({
            label: 'instance',
            metric: 'node_cpu',
            matchers: [
              { label: 'region', operator: '=', value: 'us-east' }, // row 0
              { label: 'job', operator: '=', value: 'api' }, // row 1
            ],
          }),
        })
      )
    );

    await act(async () => {
      result.current.loadMatcherValues(0);
      result.current.loadMatcherValues(1);
    });
    await flush();

    // Row 0 (region): selector = metric + sibling job, region excluded.
    expect(getLabelValues).toHaveBeenCalledWith(
      'ds-1',
      { 'match[]': '{__name__="node_cpu", job="api"}' },
      'region',
      undefined
    );
    // Row 1 (job): selector = metric + sibling region, job excluded.
    expect(getLabelValues).toHaveBeenCalledWith(
      'ds-1',
      { 'match[]': '{__name__="node_cpu", region="us-east"}' },
      'job',
      undefined
    );
  });

  it('passes no selector when there is neither a metric nor a filled sibling', async () => {
    const getLabelValues = jest.fn().mockResolvedValue(['x']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const { result } = renderHook(() =>
      usePromqlDropdownData(
        baseArgs({
          promQLResourceQuery: labelValuesQuery({
            matchers: [{ label: 'instance', operator: '=', value: '' }],
          }),
        })
      )
    );

    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();

    expect(getLabelValues).toHaveBeenCalledWith('ds-1', undefined, 'instance', undefined);
  });

  it('does not refetch when the (label, selector) is already cached', async () => {
    const getLabelValues = jest.fn().mockResolvedValue(['a']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const { result } = renderHook(() =>
      usePromqlDropdownData(
        baseArgs({
          promQLResourceQuery: labelValuesQuery({
            matchers: [{ label: 'instance', operator: '=', value: '' }],
          }),
        })
      )
    );

    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();
    expect(getLabelValues).toHaveBeenCalledTimes(1);

    // Opening the same dropdown again — served from cache, no new fetch.
    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();
    expect(getLabelValues).toHaveBeenCalledTimes(1);
  });

  it('reports loading state while a row fetch is in flight, then clears it', async () => {
    let resolveValues: (v: string[]) => void = () => {};
    const getLabelValues = jest.fn(
      () => new Promise<string[]>((resolve) => (resolveValues = resolve))
    );
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const { result } = renderHook(() =>
      usePromqlDropdownData(
        baseArgs({
          promQLResourceQuery: labelValuesQuery({
            matchers: [{ label: 'instance', operator: '=', value: '' }],
          }),
        })
      )
    );

    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    // Fetch in flight.
    expect(result.current.isMatcherValueLoading(0)).toBe(true);

    await act(async () => {
      resolveValues(['host-a']);
      await Promise.resolve();
    });

    expect(result.current.isMatcherValueLoading(0)).toBe(false);
    expect(result.current.getMatcherValueOptions(0)).toEqual(['host-a']);
  });

  it('clears cached matcher values when the dataset changes', async () => {
    const getLabelValues = jest.fn().mockResolvedValue(['a']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const query = labelValuesQuery({
      matchers: [{ label: 'instance', operator: '=', value: '' }],
    });
    const { result, rerender } = renderHook(
      (p: UsePromqlDropdownDataArgs) => usePromqlDropdownData(p),
      { initialProps: baseArgs({ promQLResourceQuery: query }) }
    );

    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();
    expect(result.current.getMatcherValueOptions(0)).toEqual(['a']);

    // Switch dataset: cached values are dropped, so the dropdown reads empty until reopened.
    rerender(
      baseArgs({
        dataset: { id: 'ds-2', title: 'ds-2', type: 'PROMETHEUS' } as any,
        promQLResourceQuery: query,
      })
    );
    await flush();
    expect(result.current.getMatcherValueOptions(0)).toEqual([]);

    // Reopening fetches again, now against ds-2.
    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();
    expect(getLabelValues).toHaveBeenLastCalledWith('ds-2', undefined, 'instance', undefined);
  });

  it('discards an in-flight matcher-value result whose dataset changed before it resolved', async () => {
    // First request (ds-1) is deferred so it resolves AFTER the dataset switches.
    // The cache key excludes the dataset, so without a guard the ds-1 values would
    // be read under ds-2 for the same-named label.
    let resolveFirst: (v: string[]) => void = () => {};
    const getLabelValues = jest
      .fn()
      .mockImplementationOnce(() => new Promise<string[]>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue(['ds2-value']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const query = labelValuesQuery({
      matchers: [{ label: 'instance', operator: '=', value: '' }],
    });
    const { result, rerender } = renderHook(
      (p: UsePromqlDropdownDataArgs) => usePromqlDropdownData(p),
      { initialProps: baseArgs({ promQLResourceQuery: query }) }
    );

    // Open on ds-1 — first request in flight.
    await act(async () => {
      result.current.loadMatcherValues(0);
    });

    // Switch to ds-2 and load again (fresh request resolves immediately).
    rerender(
      baseArgs({
        dataset: { id: 'ds-2', title: 'ds-2', type: 'PROMETHEUS' } as any,
        promQLResourceQuery: query,
      })
    );
    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();

    // Let the stale ds-1 request resolve out of order.
    await act(async () => {
      resolveFirst(['ds1-value']);
      await Promise.resolve();
    });

    // The ds-1 values must NOT leak into the ds-2 dropdown.
    expect(result.current.getMatcherValueOptions(0)).toEqual(['ds2-value']);
  });

  it('rescopes matcher values on metric change without leaking an in-flight result across it', async () => {
    // node_cpu request is deferred so it resolves after the metric switches to
    // node_memory. The node_memory dropdown must show only its own values, and
    // switching back to node_cpu must re-fetch rather than serve a leaked entry.
    let resolveFirst: (v: string[]) => void = () => {};
    const getLabelValues = jest
      .fn()
      .mockImplementationOnce(() => new Promise<string[]>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue(['mem-value']);
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const cpuQuery = labelValuesQuery({
      metric: 'node_cpu',
      matchers: [{ label: 'instance', operator: '=', value: '' }],
    });
    const { result, rerender } = renderHook(
      (p: UsePromqlDropdownDataArgs) => usePromqlDropdownData(p),
      { initialProps: baseArgs({ promQLResourceQuery: cpuQuery }) }
    );

    // Open under node_cpu — first request in flight, scoped to node_cpu.
    await act(async () => {
      result.current.loadMatcherValues(0);
    });

    // Change metric to node_memory and load again (fresh request resolves).
    rerender(
      baseArgs({
        promQLResourceQuery: labelValuesQuery({
          metric: 'node_memory',
          matchers: [{ label: 'instance', operator: '=', value: '' }],
        }),
      })
    );
    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();

    // Let the stale node_cpu request resolve out of order.
    await act(async () => {
      resolveFirst(['cpu-value']);
      await Promise.resolve();
    });

    // Current (node_memory) dropdown shows only its own values.
    expect(result.current.getMatcherValueOptions(0)).toEqual(['mem-value']);

    // The stale write was discarded, not just hidden by the changed cache key:
    // switching back to node_cpu must re-fetch (cache miss), not serve a leaked entry.
    const callsBeforeSwitchBack = getLabelValues.mock.calls.length;
    rerender(baseArgs({ promQLResourceQuery: cpuQuery }));
    await act(async () => {
      result.current.loadMatcherValues(0);
    });
    await flush();
    expect(getLabelValues.mock.calls.length).toBeGreaterThan(callsBeforeSwitchBack);
  });

  it('getMatcherValueOptions returns [] for an out-of-range row', async () => {
    const { result } = renderHook(() =>
      usePromqlDropdownData(
        baseArgs({
          promQLResourceQuery: labelValuesQuery({
            matchers: [{ label: 'instance', operator: '=', value: '' }],
          }),
        })
      )
    );
    await flush();

    expect(result.current.getMatcherValueOptions(5)).toEqual([]);
  });

  it('does not update state when a fetch resolves after unmount', async () => {
    let resolveMetrics: (m: string[]) => void = () => {};
    const getMetrics = jest.fn(
      () => new Promise<string[]>((resolve) => (resolveMetrics = resolve))
    );
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getMetrics }));

    const { result, unmount } = renderHook(() => usePromqlDropdownData(baseArgs()));
    await act(async () => {
      result.current.loadMetricNames();
    });

    // Unmount while the request is in flight, then let it resolve.
    unmount();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      resolveMetrics(['up']);
      await Promise.resolve();
    });

    // No "state update on unmounted component" warning should have been emitted.
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('does not fetch when the query type is not prometheusResource', async () => {
    const getLabelValues = jest.fn();
    mockGetPromQLResourceClient.mockReturnValue(makeClient({ getLabelValues }));

    const { result } = renderHook(() =>
      usePromqlDropdownData(baseArgs({ isPrometheusResource: false }))
    );
    await flush();

    // Non-labelValues query has no matcher rows, so nothing to load.
    expect(result.current.promqlMatchers).toEqual([]);
    expect(getLabelValues).not.toHaveBeenCalled();
  });
});
