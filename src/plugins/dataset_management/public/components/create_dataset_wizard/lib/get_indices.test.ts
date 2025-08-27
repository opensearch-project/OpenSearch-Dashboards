/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getIndices, responseToItemArray, dedupeMatchedItems } from './get_indices';
import { httpServiceMock } from '../../../../../../core/public/mocks';
import { ResolveIndexResponseItemIndexAttrs, MatchedItem } from '../types';
import { Observable } from 'rxjs';

export const successfulResolveResponse = {
  indices: [
    {
      name: 'remoteCluster1:bar-01',
      attributes: ['open'],
    },
  ],
  aliases: [
    {
      name: 'f-alias',
      indices: ['freeze-index', 'my-index'],
    },
  ],
  data_streams: [
    {
      name: 'foo',
      backing_indices: ['foo-000001'],
      timestamp_field: '@timestamp',
    },
  ],
};

const successfulSearchResponse = {
  rawResponse: {
    aggregations: {
      indices: {
        buckets: [
          { key: 'opensearch_dashboards_sample_data_ecommerce' },
          { key: '.opensearch_dashboards_1' },
        ],
      },
    },
  },
};

const getIndexTags = () => [];
const searchClient = () =>
  new Observable((observer) => {
    observer.next(successfulSearchResponse);
    observer.complete();
  }) as any;
const dataSourceId = 'dataSourceId';

const http = httpServiceMock.createStartContract();
http.get.mockResolvedValue(successfulResolveResponse);

describe('getIndices', () => {
  it('should work in a basic case with data source', async () => {
    const uncalledSearchClient = jest.fn();
    const result = await getIndices({
      http,
      getIndexTags,
      pattern: 'opensearch-dashboards',
      searchClient: uncalledSearchClient,
      dataSourceId,
    });
    expect(http.get).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ query: { data_source: dataSourceId } })
    );
    expect(uncalledSearchClient).not.toHaveBeenCalled();
    expect(result.length).toBe(3);
    expect(result[0].name).toBe('f-alias');
    expect(result[1].name).toBe('foo');
  });

  it('should work in a basic case', async () => {
    const uncalledSearchClient = jest.fn();
    const result = await getIndices({
      http,
      getIndexTags,
      pattern: 'opensearch-dashboards',
      searchClient: uncalledSearchClient,
    });
    expect(http.get).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ query: { data_source: dataSourceId } })
    );
    expect(uncalledSearchClient).not.toHaveBeenCalled();
    expect(result.length).toBe(3);
    expect(result[0].name).toBe('f-alias');
    expect(result[1].name).toBe('foo');
  });

  it('should make two calls in cross cluster case', async () => {
    http.get.mockResolvedValue(successfulResolveResponse);
    const result = await getIndices({
      http,
      getIndexTags,
      pattern: '*:opensearch-dashboards',
      searchClient,
      dataSourceId,
    });

    expect(http.get).toHaveBeenCalled();
    expect(result.length).toBe(4);
    expect(result[0].name).toBe('f-alias');
    expect(result[1].name).toBe('foo');
    expect(result[2].name).toBe('opensearch_dashboards_sample_data_ecommerce');
    expect(result[3].name).toBe('remoteCluster1:bar-01');
  });

  it('should ignore ccs query-all', async () => {
    expect(
      (await getIndices({ http, getIndexTags, pattern: '*:', searchClient, dataSourceId })).length
    ).toBe(0);
  });

  it('should ignore a single comma', async () => {
    expect(
      (await getIndices({ http, getIndexTags, pattern: ',', searchClient, dataSourceId })).length
    ).toBe(0);
    expect(
      (await getIndices({ http, getIndexTags, pattern: ',*', searchClient, dataSourceId })).length
    ).toBe(0);
    expect(
      (await getIndices({ http, getIndexTags, pattern: ',foobar', searchClient, dataSourceId }))
        .length
    ).toBe(0);
  });

  it('response object to item array', () => {
    const result = {
      indices: [
        {
          name: 'test_index',
        },
        {
          name: 'frozen_index',
          attributes: ['frozen' as ResolveIndexResponseItemIndexAttrs],
        },
      ],
      aliases: [
        {
          name: 'test_alias',
          indices: [],
        },
      ],
      data_streams: [
        {
          name: 'test_data_stream',
          backing_indices: [],
          timestamp_field: 'test_timestamp_field',
        },
      ],
    };
    expect(responseToItemArray(result, getIndexTags)).toMatchSnapshot();
    expect(responseToItemArray({}, getIndexTags)).toEqual([]);
  });

  it('matched items are deduped', () => {
    const setA = [{ name: 'a' }, { name: 'b' }] as MatchedItem[];
    const setB = [{ name: 'b' }, { name: 'c' }] as MatchedItem[];
    expect(dedupeMatchedItems(setA, setB)).toHaveLength(3);
  });

  describe('errors', () => {
    it('should handle errors gracefully', async () => {
      http.get.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      const result = await getIndices({
        http,
        getIndexTags,
        pattern: 'opensearch-dashboards',
        searchClient,
      });
      expect(result.length).toBe(0);
    });

    it('should throw error with data source use case', async () => {
      http.get.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      expect(
        getIndices({
          http,
          getIndexTags,
          pattern: 'opensearch-dashboards',
          searchClient,
          dataSourceId,
        })
      ).rejects.toThrowError();
    });
  });
});
