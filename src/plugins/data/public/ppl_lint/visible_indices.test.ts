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
      query: { expand_wildcards: 'all' },
    });
  });

  it('passes the data_source query param when a dataSourceId is given', async () => {
    const get = jest.fn().mockResolvedValue({ indices: [{ name: 'remote-logs' }] });

    await fetchVisibleIndices(makeHttp(get), 'ds-42');

    expect(get).toHaveBeenCalledWith('/internal/index-pattern-management/resolve_index/*', {
      query: { expand_wildcards: 'all', data_source: 'ds-42' },
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

  it('returns a sorted list at the exact 5000-name boundary', async () => {
    const indices = Array.from({ length: 2000 }, (_, i) => ({
      name: `logs-${String(i).padStart(5, '0')}`,
    }));
    const aliases = Array.from({ length: 2000 }, (_, i) => ({
      name: `alias-${String(i).padStart(5, '0')}`,
    }));
    const dataStreams = Array.from({ length: 1000 }, (_, i) => ({
      name: `metrics-${String(i).padStart(5, '0')}`,
    }));
    const get = jest.fn().mockResolvedValue({
      indices,
      aliases,
      data_streams: dataStreams,
    });

    const result = await fetchVisibleIndices(makeHttp(get));

    expect(result).toHaveLength(5000);
    expect(result).toEqual([...indices, ...aliases, ...dataStreams].map(({ name }) => name).sort());
  });

  it('returns an empty list at 5001 names without flattening the response', async () => {
    const indices = Array.from({ length: 5001 }, (_, i) => ({ name: `idx-${i}` }));
    const forEach = jest.spyOn(indices, 'forEach');
    const get = jest.fn().mockResolvedValue({ indices });

    expect(await fetchVisibleIndices(makeHttp(get))).toEqual([]);
    expect(forEach).not.toHaveBeenCalled();
  });

  it('self-suppresses for a realistic 20000-name response without flattening it', async () => {
    const indices = Array.from({ length: 12000 }, (_, i) => ({
      name: `logs-prod-${String(i).padStart(5, '0')}`,
    }));
    const aliases = Array.from({ length: 5000 }, (_, i) => ({
      name: `logs-alias-${String(i).padStart(5, '0')}`,
    }));
    const dataStreams = Array.from({ length: 3000 }, (_, i) => ({
      name: `metrics-prod-${String(i).padStart(5, '0')}`,
    }));
    const indexIteration = jest.spyOn(indices, 'forEach');
    const aliasIteration = jest.spyOn(aliases, 'forEach');
    const dataStreamIteration = jest.spyOn(dataStreams, 'forEach');
    const get = jest.fn().mockResolvedValue({
      indices,
      aliases,
      data_streams: dataStreams,
    });

    expect(await fetchVisibleIndices(makeHttp(get), 'ds-large')).toEqual([]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/internal/index-pattern-management/resolve_index/*', {
      query: { expand_wildcards: 'all', data_source: 'ds-large' },
    });
    expect(indexIteration).not.toHaveBeenCalled();
    expect(aliasIteration).not.toHaveBeenCalled();
    expect(dataStreamIteration).not.toHaveBeenCalled();
  });

  it('tolerates a response with no index buckets', async () => {
    const get = jest.fn().mockResolvedValue({});
    expect(await fetchVisibleIndices(makeHttp(get))).toEqual([]);
  });
});
