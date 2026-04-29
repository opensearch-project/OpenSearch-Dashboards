/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useMetricData } from './use_metric_data';
import { PrometheusClient } from '../explore/services/prometheus_client';

function makeClient(overrides: Partial<jest.Mocked<PrometheusClient>> = {}) {
  return ({
    getMetricNames: jest.fn().mockResolvedValue([]),
    searchMetricNames: jest.fn().mockResolvedValue([]),
    getSeries: jest.fn().mockResolvedValue([]),
    getLabelsForMetric: jest.fn().mockResolvedValue([]),
    getLabelValues: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown) as jest.Mocked<PrometheusClient>;
}

describe('useMetricData label fetching', () => {
  it('does not fetch series when metric is empty', async () => {
    const client = makeClient();
    const { result } = renderHook(() => useMetricData(client, ''));

    expect(client.getSeries).not.toHaveBeenCalled();
    expect(client.getLabelsForMetric).not.toHaveBeenCalled();
    expect(result.current.labelOptions).toEqual([]);
    expect(result.current.labelCardinality).toEqual({});
  });

  it('derives label options and cardinality from a single getSeries call', async () => {
    const client = makeClient({
      getSeries: jest.fn().mockResolvedValue([
        { __name__: 'm', instance: 'a', job: 'prom' },
        { __name__: 'm', instance: 'b', job: 'prom' },
        { __name__: 'm', instance: 'a', job: 'node' },
      ]),
    });

    const { result } = renderHook(() => useMetricData(client, 'm'));
    await waitFor(() =>
      expect(result.current.labelOptions.map((o) => o.label)).toEqual(['instance', 'job'])
    );

    // Only the series endpoint should be hit — no redundant /labels?match[] call.
    expect(client.getSeries).toHaveBeenCalledTimes(1);
    expect(client.getSeries).toHaveBeenCalledWith('{__name__="m"}');
    expect(client.getLabelsForMetric).not.toHaveBeenCalled();
    expect(result.current.labelCardinality).toEqual({ instance: 2, job: 2 });
  });

  it('refetches when metric changes', async () => {
    const client = makeClient({
      getSeries: jest
        .fn()
        .mockResolvedValueOnce([{ __name__: 'a', instance: 'x' }])
        .mockResolvedValueOnce([{ __name__: 'b', job: 'y' }]),
    });

    const { result, rerender } = renderHook(({ metric }) => useMetricData(client, metric), {
      initialProps: { metric: 'a' },
    });
    await waitFor(() =>
      expect(result.current.labelOptions.map((o) => o.label)).toEqual(['instance'])
    );

    rerender({ metric: 'b' });
    await waitFor(() => expect(result.current.labelOptions.map((o) => o.label)).toEqual(['job']));
    expect(client.getSeries).toHaveBeenCalledTimes(2);
    expect(client.getSeries).toHaveBeenLastCalledWith('{__name__="b"}');
    expect(result.current.labelCardinality).toEqual({ job: 1 });
  });

  it('ignores series results after unmount', async () => {
    let resolve: (v: Array<Record<string, string>>) => void = () => {};
    const client = makeClient({
      getSeries: jest.fn().mockImplementation(
        () =>
          new Promise<Array<Record<string, string>>>((r) => {
            resolve = r;
          })
      ),
    });

    const { result, unmount } = renderHook(() => useMetricData(client, 'm'));
    unmount();

    await act(async () => {
      resolve([{ __name__: 'm', instance: 'a' }]);
      await Promise.resolve();
    });

    // State was not updated after unmount — default empty array remains.
    expect(result.current.labelOptions).toEqual([]);
  });

  it('swallows getSeries errors', async () => {
    const client = makeClient({
      getSeries: jest.fn().mockRejectedValue(new Error('boom')),
    });

    const { result } = renderHook(() => useMetricData(client, 'm'));
    await waitFor(() => expect(client.getSeries).toHaveBeenCalled());

    expect(result.current.labelOptions).toEqual([]);
    expect(result.current.labelCardinality).toEqual({});
  });
});
