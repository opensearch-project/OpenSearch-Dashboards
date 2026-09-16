/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ILegacyClusterClient,
  Logger,
  RequestHandlerContext,
  SharedGlobalConfig,
} from 'opensearch-dashboards/server';
import { Observable, of } from 'rxjs';
import { DATA_FRAME_TYPES, IOpenSearchDashboardsSearchRequest } from '../../../data/common';
import { SearchUsage } from '../../../data/server';
import * as utils from '../../common/utils';
import * as facet from '../utils/facet';
import { pplSearchStrategyProvider } from './ppl_search_strategy';

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  getFields: jest.fn(),
}));

describe('pplSearchStrategyProvider', () => {
  let config$: Observable<SharedGlobalConfig>;
  let logger: Logger;
  let client: ILegacyClusterClient;
  let usage: SearchUsage;
  let mockRequestHandlerContext: RequestHandlerContext;

  beforeEach(() => {
    config$ = of({} as SharedGlobalConfig);
    logger = {
      error: jest.fn(),
    } as unknown as Logger;
    client = {} as ILegacyClusterClient;
    usage = {
      trackSuccess: jest.fn(),
      trackError: jest.fn(),
    } as SearchUsage;
    mockRequestHandlerContext = {
      core: {
        uiSettings: {
          client: {
            // Return distinct values per setting so tests can tell the two sample sizes apart.
            get: jest.fn((setting: string) =>
              Promise.resolve(setting === 'discover:aggregationSampleSize' ? 2000 : 500)
            ),
          },
        },
      },
    } as unknown as RequestHandlerContext;
  });

  it('should return an object with a search method', () => {
    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    expect(strategy).toHaveProperty('search');
    expect(typeof strategy.search).toBe('function');
  });

  it('should handle successful search response', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [
          { name: 'field1', type: 'long' },
          { name: 'field2', type: 'text' },
        ],
        datarows: [
          [1, 'value1'],
          [2, 'value2'],
        ],
      },
      took: 100,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(result).toEqual({
      type: DATA_FRAME_TYPES.DEFAULT,
      body: {
        name: 'test-dataset',
        fields: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        schema: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        size: 2,
      },
      took: 100,
    });
    expect(usage.trackSuccess).toHaveBeenCalledWith(100);
  });

  it('should handle failed search response', async () => {
    const mockResponse = {
      success: false,
      data: { cause: 'Query failed' },
      took: 50,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await expect(
      strategy.search(
        mockRequestHandlerContext,
        {
          body: { query: { query: 'source = table' } },
        } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrow();
  });

  it('should handle exceptions', async () => {
    const mockError = new Error('Something went wrong');
    const mockFacet = {
      describeQuery: jest.fn().mockRejectedValue(mockError),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await expect(
      strategy.search(
        mockRequestHandlerContext,
        {
          body: { query: { query: 'source = table' } },
        } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrow(mockError);
    expect(logger.error).toHaveBeenCalledWith(`pplSearchStrategy: ${mockError.message}`);
    expect(usage.trackError).toHaveBeenCalled();
  });

  it('should throw error when describeQuery success is false', async () => {
    const mockError = new Error('Something went wrong');
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue({ success: false, data: mockError }),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await expect(
      strategy.search(
        mockRequestHandlerContext,
        {
          body: { query: { query: 'source = table' } },
        } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(mockError.message));
    expect(usage.trackError).toHaveBeenCalled();
  });

  it('should not send fetchSize when query ends with head', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
      },
      took: 100,
    };
    const mockDescribeQuery = jest.fn().mockResolvedValue(mockResponse);
    const mockFacet = {
      describeQuery: mockDescribeQuery,
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = table | head 600', dataset: { id: 'test-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(mockRequestHandlerContext.core.uiSettings.client.get).not.toHaveBeenCalled();
    const requestArg = mockDescribeQuery.mock.calls[0][1];
    expect(requestArg.body.fetchSize).toBeUndefined();
  });

  it('should send fetchSize when head is followed by other commands', async () => {
    (mockRequestHandlerContext.core.uiSettings.client.get as jest.Mock).mockResolvedValue(500);
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
      },
      took: 100,
    };
    const mockDescribeQuery = jest.fn().mockResolvedValue(mockResponse);
    const mockFacet = {
      describeQuery: mockDescribeQuery,
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await strategy.search(
      mockRequestHandlerContext,
      {
        body: {
          query: {
            query: 'source = table | head 600 | sort name ASC',
            dataset: { id: 'test-dataset' },
          },
        },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(mockRequestHandlerContext.core.uiSettings.client.get).toHaveBeenCalledWith(
      'discover:sampleSize'
    );
    const requestArg = mockDescribeQuery.mock.calls[0][1];
    expect(requestArg.body.fetchSize).toBe(500);
  });

  it('should send fetchSize when head is only inside a subquery', async () => {
    (mockRequestHandlerContext.core.uiSettings.client.get as jest.Mock).mockResolvedValue(500);
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
      },
      took: 100,
    };
    const mockDescribeQuery = jest.fn().mockResolvedValue(mockResponse);
    const mockFacet = {
      describeQuery: mockDescribeQuery,
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await strategy.search(
      mockRequestHandlerContext,
      {
        body: {
          query: {
            query:
              'source=state_country | inner join left=a, right=b ON a.name = b.name' +
              ' [source=state_country | sort name | head 3] | sort a.name | fields a.name, a.age',
            dataset: { id: 'test-dataset' },
          },
        },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(mockRequestHandlerContext.core.uiSettings.client.get).toHaveBeenCalledWith(
      'discover:sampleSize'
    );
    const requestArg = mockDescribeQuery.mock.calls[0][1];
    expect(requestArg.body.fetchSize).toBe(500);
  });

  it('should read fetchSize from discover:sampleSize UI setting', async () => {
    (mockRequestHandlerContext.core.uiSettings.client.get as jest.Mock).mockResolvedValue(200);
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
      },
      took: 100,
    };
    const mockDescribeQuery = jest.fn().mockResolvedValue(mockResponse);
    const mockFacet = {
      describeQuery: mockDescribeQuery,
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(mockRequestHandlerContext.core.uiSettings.client.get).toHaveBeenCalledWith(
      'discover:sampleSize'
    );
    const requestArg = mockDescribeQuery.mock.calls[0][1];
    expect(requestArg.body.fetchSize).toBe(200);
  });

  it.each([
    ['stats', 'source = table | stats count() by span(`@timestamp`, 1h), extension'],
    ['timechart', 'source = table | timechart span=1h count() by extension'],
    ['top', 'source = table | top 5 extension'],
    ['rare', 'source = table | rare extension'],
  ])(
    'should send the aggregation sample size for an aggregating query (%s)',
    async (_name, pplQuery) => {
      const mockResponse = {
        success: true,
        data: {
          schema: [{ name: 'field1', type: 'long' }],
          datarows: [[1]],
        },
        took: 100,
      };
      const mockDescribeQuery = jest.fn().mockResolvedValue(mockResponse);
      const mockFacet = {
        describeQuery: mockDescribeQuery,
      } as unknown as facet.Facet;
      jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
      (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

      const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
      await strategy.search(
        mockRequestHandlerContext,
        {
          body: { query: { query: pplQuery, dataset: { id: 'test-dataset' } } },
        } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(mockRequestHandlerContext.core.uiSettings.client.get).toHaveBeenCalledWith(
        'discover:aggregationSampleSize'
      );
      const requestArg = mockDescribeQuery.mock.calls[0][1];
      expect(requestArg.body.fetchSize).toBe(2000);
    }
  );

  it('should still send fetchSize when stats appears only inside a subquery', async () => {
    (mockRequestHandlerContext.core.uiSettings.client.get as jest.Mock).mockResolvedValue(500);
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
      },
      took: 100,
    };
    const mockDescribeQuery = jest.fn().mockResolvedValue(mockResponse);
    const mockFacet = {
      describeQuery: mockDescribeQuery,
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await strategy.search(
      mockRequestHandlerContext,
      {
        body: {
          query: {
            query: 'source = table | where id in [source = other | stats count() by id]',
            dataset: { id: 'test-dataset' },
          },
        },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    const requestArg = mockDescribeQuery.mock.calls[0][1];
    expect(requestArg.body.fetchSize).toBe(500);
  });

  it('should give the histogram aggregation queries the aggregation sample size', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
      },
      took: 100,
    };
    const mockDescribeQuery = jest.fn().mockResolvedValue(mockResponse);
    const mockFacet = {
      describeQuery: mockDescribeQuery,
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    await strategy.search(
      mockRequestHandlerContext,
      {
        body: {
          query: { query: 'source = table', dataset: { id: 'test-dataset' } },
          aggConfig: {
            qs: { '1': 'source = table | stats count() by span(`@timestamp`, 1h)' },
          },
        },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    // The primary document search keeps the document sample cap ...
    expect(mockDescribeQuery.mock.calls[0][1].body.fetchSize).toBe(500);
    // ... while the bucket-producing histogram query uses the larger aggregation size, not the
    // document cap it would otherwise inherit from the primary search's body.
    expect(mockDescribeQuery.mock.calls[1][1].body.fetchSize).toBe(2000);
  });

  it('should attach highlights to dataFrame meta when rawResponse contains _highlight column', async () => {
    const mockHighlights = [{ title: ['<em>OpenSearch</em>'] }, { title: ['<em>Dashboards</em>'] }];
    const mockResponse = {
      success: true,
      data: {
        schema: [
          { name: 'field1', type: 'long' },
          { name: 'field2', type: 'text' },
          { name: '_highlight', type: 'struct' },
        ],
        datarows: [
          [1, 'value1', { title: ['<em>OpenSearch</em>'] }],
          [2, 'value2', { title: ['<em>Dashboards</em>'] }],
        ],
      },
      took: 100,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    // @ts-expect-error TS2339 TODO(ts-error): fixme
    expect(result.body.meta).toBeDefined();
    // @ts-expect-error TS2339 TODO(ts-error): fixme
    expect(result.body.meta.highlights).toEqual(mockHighlights);
  });

  it('should not have highlights in meta when rawResponse has no highlights', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [
          { name: 'field1', type: 'long' },
          { name: 'field2', type: 'text' },
        ],
        datarows: [
          [1, 'value1'],
          [2, 'value2'],
        ],
      },
      took: 100,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    // @ts-expect-error TS2339 TODO(ts-error): fixme
    expect(result.body.meta?.highlights).toBeUndefined();
  });

  it('should attach warnings to dataFrame meta when rawResponse contains warnings', async () => {
    const mockWarnings = [
      {
        type: 'PARTIAL_RESULT',
        message: 'Results exclude 1 of 2 indices due to a mapping conflict.',
        detail: 'Field [env] is mapped inconsistently. Excluded indices: [logs-text].',
      },
    ];
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
        warnings: mockWarnings,
      },
      took: 100,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    // @ts-expect-error TS2339 TODO(ts-error): fixme
    expect(result.body.meta.warnings).toEqual(mockWarnings);
  });

  it('should not have warnings in meta when rawResponse has no warnings', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [{ name: 'field1', type: 'long' }],
        datarows: [[1]],
      },
      took: 100,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([{ name: 'field1', type: 'long' }]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = table', dataset: { id: 'test-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    // @ts-expect-error TS2339 TODO(ts-error): fixme
    expect(result.body.meta?.warnings).toBeUndefined();
  });

  it('should handle empty search response', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [
          { name: 'field1', type: 'long' },
          { name: 'field2', type: 'text' },
        ],
        datarows: [],
      },
      took: 10,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: { query: { query: 'source = empty_table', dataset: { id: 'empty-dataset' } } },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(result).toEqual({
      type: DATA_FRAME_TYPES.DEFAULT,
      body: {
        name: 'empty-dataset',
        fields: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        schema: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        size: 0,
      },
      took: 10,
    });
    expect(usage.trackSuccess).toHaveBeenCalledWith(10);
  });

  it('should handle aggConfig when response succeeds', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [
          { name: 'field1', type: 'long' },
          { name: 'field2', type: 'text' },
        ],
        datarows: [
          [1, 'value1'],
          [2, 'value2'],
        ],
      },
      took: 10,
    };
    const mockFacet = {
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: {
          query: { query: 'source = empty_table', dataset: { id: 'empty-dataset' } },
          aggConfig: {
            date_histogram: {
              field: 'timestamp',
              fixed_interval: '12h',
              time_zone: 'America/Los_Angeles',
              min_doc_count: 1,
            },
            qs: {
              '2': 'source = empty_table | stats count() by span(timestamp, 12h)',
            },
          },
        },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(result).toEqual({
      type: DATA_FRAME_TYPES.DEFAULT,
      body: {
        name: 'empty-dataset',
        fields: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        schema: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        aggs: {
          '2': [
            { key: 'value1', value: 1 },
            { key: 'value2', value: 2 },
          ],
        },
        meta: {
          date_histogram: {
            field: 'timestamp',
            fixed_interval: '12h',
            time_zone: 'America/Los_Angeles',
            min_doc_count: 1,
          },
          qs: { '2': 'source = empty_table | stats count() by span(timestamp, 12h)' },
        },
        size: 2,
      },
      took: 10,
    });
    expect(usage.trackSuccess).toHaveBeenCalledWith(10);
  });

  it('should handle aggConfig when aggregation fails', async () => {
    const mockResponse = {
      success: true,
      data: {
        schema: [
          { name: 'field1', type: 'long' },
          { name: 'field2', type: 'text' },
        ],
        datarows: [
          [1, 'value1'],
          [2, 'value2'],
        ],
      },
      took: 10,
    };
    const mockError = new Error('Something went wrong');
    const mockFacet = {
      describeQuery: jest
        .fn()
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValue({ success: false, data: mockError }),
    } as unknown as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = pplSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      mockRequestHandlerContext,
      {
        body: {
          query: { query: 'source = empty_table', dataset: { id: 'empty-dataset' } },
          aggConfig: {
            date_histogram: {
              field: 'timestamp',
              fixed_interval: '12h',
              time_zone: 'America/Los_Angeles',
              min_doc_count: 1,
            },
            qs: {
              '2': 'source = empty_table | stats count() by span(timestamp, 12h)',
            },
          },
        },
      } as unknown as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(result).toEqual({
      type: DATA_FRAME_TYPES.DEFAULT,
      body: {
        name: 'empty-dataset',
        fields: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        schema: [
          { name: 'field1', type: 'long', values: [] },
          { name: 'field2', type: 'text', values: [] },
        ],
        meta: {
          date_histogram: {
            field: 'timestamp',
            fixed_interval: '12h',
            time_zone: 'America/Los_Angeles',
            min_doc_count: 1,
          },
          qs: { '2': 'source = empty_table | stats count() by span(timestamp, 12h)' },
        },
        size: 2,
      },
      took: 10,
    });
    expect(usage.trackSuccess).toHaveBeenCalledWith(10);
  });
});
