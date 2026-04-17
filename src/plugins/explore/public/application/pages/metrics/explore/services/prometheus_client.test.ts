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
