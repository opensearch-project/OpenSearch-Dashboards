/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchVisibleIndices } from './visible_indices';
import { HttpSetup } from '../../../../core/public';

const makeHttp = (get: jest.Mock): HttpSetup => ({ get }) as unknown as HttpSetup;

describe('fetchVisibleIndices', () => {
  it('flattens indices, aliases, and data streams into a sorted name list', async () => {
    const get = jest.fn().mockResolvedValue({
      indices: [{ name: 'logs-2025' }, { name: 'accounts' }],
      aliases: [{ name: 'all-logs' }],
      data_streams: [{ name: 'metrics' }],
    });

    const result = await fetchVisibleIndices(makeHttp(get));

    expect(result).toEqual(['accounts', 'all-logs', 'logs-2025', 'metrics']);
    expect(get).toHaveBeenCalledWith('/internal/index-pattern-management/resolve_index/*', {
      query: {},
    });
  });

  it('passes the data_source query param when a dataSourceId is given', async () => {
    const get = jest.fn().mockResolvedValue({ indices: [{ name: 'remote-logs' }] });

    await fetchVisibleIndices(makeHttp(get), 'ds-42');

    expect(get).toHaveBeenCalledWith('/internal/index-pattern-management/resolve_index/*', {
      query: { data_source: 'ds-42' },
    });
  });

  it('returns an empty list when the request fails', async () => {
    const get = jest.fn().mockRejectedValue(new Error('boom'));
    expect(await fetchVisibleIndices(makeHttp(get))).toEqual([]);
  });

  it('returns an empty list on a null response', async () => {
    const get = jest.fn().mockResolvedValue(null);
    expect(await fetchVisibleIndices(makeHttp(get))).toEqual([]);
  });

  it('returns an empty list above the 5000-index cap', async () => {
    const indices = Array.from({ length: 5001 }, (_, i) => ({ name: `idx-${i}` }));
    const get = jest.fn().mockResolvedValue({ indices });
    expect(await fetchVisibleIndices(makeHttp(get))).toEqual([]);
  });

  it('tolerates a response with no index buckets', async () => {
    const get = jest.fn().mockResolvedValue({});
    expect(await fetchVisibleIndices(makeHttp(get))).toEqual([]);
  });
});
