/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrometheusClient } from './prometheus_client';
import { ExploreServices } from '../../../../../types';

// transformHitsToSeries is private but is the only thing worth exercising in
// isolation here — it's the layer that turns server hits into the shape the
// UI consumes. Reach into it via `as any` rather than reshaping the public API
// just for tests.
const transform = (client: PrometheusClient, hits: unknown[]): any[] => {
  return (client as any).transformHitsToSeries(hits);
};

const makeClient = (): PrometheusClient => {
  return new PrometheusClient(({} as unknown) as ExploreServices, 'conn-1');
};

interface MockResourceClient {
  getMetrics: jest.Mock;
  getMetricMetadata: jest.Mock;
  getLabels: jest.Mock;
  getLabelValues: jest.Mock;
  getSeries: jest.Mock;
}

const makeClientWithResources = (
  timeRange: { from: string; to: string } = { from: 'now-1h', to: 'now' }
): { client: PrometheusClient; rc: MockResourceClient; getTime: jest.Mock } => {
  const rc: MockResourceClient = {
    getMetrics: jest.fn().mockResolvedValue(['up']),
    getMetricMetadata: jest.fn().mockResolvedValue({
      up: [{ type: 'gauge', unit: '', help: 'help text' }],
    }),
    getLabels: jest.fn().mockResolvedValue(['__name__', 'job', 'instance']),
    getLabelValues: jest.fn().mockResolvedValue(['a', 'b']),
    getSeries: jest.fn().mockResolvedValue([{ __name__: 'up' }]),
  };
  const getTime = jest.fn(() => timeRange);
  const services = ({
    data: {
      resourceClientFactory: { get: () => rc },
      query: { timefilter: { timefilter: { getTime } } },
    },
  } as unknown) as ExploreServices;
  return { client: new PrometheusClient(services, 'conn-1'), rc, getTime };
};

describe('PrometheusClient.transformHitsToSeries', () => {
  const client = makeClient();

  it('returns empty array for no hits', () => {
    expect(transform(client, [])).toEqual([]);
  });

  it('groups datapoints by series and carries structured labels through', () => {
    const hits = [
      {
        _source: {
          Time: 1000,
          Series: 'up{job="api"}',
          Labels: { job: 'api' },
          Value: 1,
        },
      },
      {
        _source: {
          Time: 2000,
          Series: 'up{job="api"}',
          Labels: { job: 'api' },
          Value: 1,
        },
      },
      {
        _source: {
          Time: 1000,
          Series: 'up{job="db"}',
          Labels: { job: 'db' },
          Value: 0,
        },
      },
    ];

    const result = transform(client, hits);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      metric: { __name__: 'up{job="api"}', job: 'api' },
      values: [
        [1, '1'],
        [2, '1'],
      ],
    });
    expect(result[1]).toEqual({
      metric: { __name__: 'up{job="db"}', job: 'db' },
      values: [[1, '0']],
    });
  });

  it('preserves label values that contain quotes and backslashes', () => {
    // These are the cases that broke the old string parser. With the server
    // emitting structured Labels, they flow through untouched.
    const hits = [
      {
        _source: {
          Time: 1000,
          Series: 'm{a="x\\"y",b="C:\\\\tmp"}',
          Labels: { a: 'x"y', b: 'C:\\tmp' },
          Value: 42,
        },
      },
    ];

    const result = transform(client, hits);

    expect(result[0].metric).toEqual({
      __name__: 'm{a="x\\"y",b="C:\\\\tmp"}',
      a: 'x"y',
      b: 'C:\\tmp',
    });
  });

  it('falls back to empty labels when Labels is missing', () => {
    const hits = [{ _source: { Time: 1000, Series: 'scalar', Value: 1 } }];
    const result = transform(client, hits);
    expect(result[0].metric).toEqual({ __name__: 'scalar' });
  });

  it('ignores non-object Labels defensively', () => {
    const hits = [{ _source: { Time: 1000, Series: 's', Labels: 'not-an-object', Value: 1 } }];
    const result = transform(client, hits);
    expect(result[0].metric).toEqual({ __name__: 's' });
  });
});

// Resource-API calls must carry the active timefilter range through to the
// Prometheus server — otherwise the UI shows metrics/labels that span the
// entire retention window rather than the range the user selected. These
// tests lock that behavior down so a future refactor can't silently drop it.
describe('PrometheusClient resource calls propagate time range', () => {
  it('passes the current time range to getMetricNames', async () => {
    const tr = { from: 'now-15m', to: 'now' };
    const { client, rc } = makeClientWithResources(tr);
    await client.getMetricNames();
    expect(rc.getMetrics).toHaveBeenCalledWith('conn-1', undefined, tr);
  });

  it('passes the current time range to getMetadata (with and without metric)', async () => {
    const tr = { from: 'now-1h', to: 'now' };
    const { client, rc } = makeClientWithResources(tr);
    await client.getMetadata();
    expect(rc.getMetricMetadata).toHaveBeenLastCalledWith('conn-1', undefined, undefined, tr);
    await client.getMetadata('up');
    expect(rc.getMetricMetadata).toHaveBeenLastCalledWith('conn-1', undefined, 'up', tr);
  });

  it('passes the current time range to getLabelNames and getLabelsForMetric', async () => {
    const tr = { from: 'now-2h', to: 'now' };
    const { client, rc } = makeClientWithResources(tr);
    await client.getLabelNames();
    expect(rc.getLabels).toHaveBeenLastCalledWith('conn-1', undefined, undefined, tr);
    await client.getLabelsForMetric('up');
    expect(rc.getLabels).toHaveBeenLastCalledWith('conn-1', undefined, 'up', tr);
  });

  it('passes the current time range to getLabelValues', async () => {
    const tr = { from: 'now-30m', to: 'now' };
    const { client, rc } = makeClientWithResources(tr);
    await client.getLabelValues('job', 'up');
    expect(rc.getLabelValues).toHaveBeenCalledWith(
      'conn-1',
      { 'match[]': '{__name__="up"}' },
      'job',
      tr
    );
  });

  it('passes the current time range to getSeries and searchMetricNames', async () => {
    const tr = { from: 'now-5m', to: 'now' };
    const { client, rc } = makeClientWithResources(tr);
    await client.getSeries('{__name__="up"}');
    expect(rc.getSeries).toHaveBeenLastCalledWith('conn-1', '{__name__="up"}', undefined, tr);

    rc.getSeries.mockResolvedValueOnce([{ __name__: 'http_requests_total' }]);
    await client.searchMetricNames('http');
    const lastCall = rc.getSeries.mock.calls[rc.getSeries.mock.calls.length - 1];
    expect(lastCall[3]).toEqual(tr);
  });

  it('scopes the cache by time range so a new range triggers a fresh fetch', async () => {
    const tr = { from: 'now-15m', to: 'now' };
    const { client, rc, getTime } = makeClientWithResources(tr);
    await client.getMetricNames();
    await client.getMetricNames(); // cache hit — same range
    expect(rc.getMetrics).toHaveBeenCalledTimes(1);

    getTime.mockReturnValue({ from: 'now-1h', to: 'now' });
    await client.getMetricNames();
    expect(rc.getMetrics).toHaveBeenCalledTimes(2);
  });
});
