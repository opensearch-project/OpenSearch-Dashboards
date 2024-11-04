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
import { sqlSearchStrategyProvider } from './sql_search_strategy';

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  getFields: jest.fn(),
}));

describe('sqlSearchStrategyProvider', () => {
  let config$: Observable<SharedGlobalConfig>;
  let logger: Logger;
  let client: ILegacyClusterClient;
  let usage: SearchUsage;
  const emptyRequestHandlerContext = ({} as unknown) as RequestHandlerContext;

  beforeEach(() => {
    config$ = of({} as SharedGlobalConfig);
    logger = ({
      error: jest.fn(),
    } as unknown) as Logger;
    client = {} as ILegacyClusterClient;
    usage = {
      trackSuccess: jest.fn(),
      trackError: jest.fn(),
    } as SearchUsage;
  });

  it('should return an object with a search method', () => {
    const strategy = sqlSearchStrategyProvider(config$, logger, client, usage);
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
    const mockFacet = ({
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown) as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = sqlSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      emptyRequestHandlerContext,
      ({
        body: { query: { query: 'SELECT * FROM table', dataset: { id: 'test-dataset' } } },
      } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
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
    const mockFacet = ({
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown) as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);

    const strategy = sqlSearchStrategyProvider(config$, logger, client, usage);
    await expect(
      strategy.search(
        emptyRequestHandlerContext,
        ({
          body: { query: { query: 'SELECT * FROM table' } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrow();
  });

  it('should handle exceptions', async () => {
    const mockError = new Error('Something went wrong');
    const mockFacet = ({
      describeQuery: jest.fn().mockRejectedValue(mockError),
    } as unknown) as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);

    const strategy = sqlSearchStrategyProvider(config$, logger, client, usage);
    await expect(
      strategy.search(
        emptyRequestHandlerContext,
        ({
          body: { query: { query: 'SELECT * FROM table' } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrow(mockError);
    expect(logger.error).toHaveBeenCalledWith(`sqlSearchStrategy: ${mockError.message}`);
    expect(usage.trackError).toHaveBeenCalled();
  });

  it('should throw error when describeQuery success is false', async () => {
    const mockError = new Error('Something went wrong');
    const mockFacet = ({
      describeQuery: jest.fn().mockResolvedValue({ success: false, data: mockError }),
    } as unknown) as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);

    const strategy = sqlSearchStrategyProvider(config$, logger, client, usage);
    await expect(
      strategy.search(
        emptyRequestHandlerContext,
        ({
          body: { query: { query: 'SELECT * FROM table' } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrowError();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(mockError.message));
    expect(usage.trackError).toHaveBeenCalled();
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
    const mockFacet = ({
      describeQuery: jest.fn().mockResolvedValue(mockResponse),
    } as unknown) as facet.Facet;
    jest.spyOn(facet, 'Facet').mockImplementation(() => mockFacet);
    (utils.getFields as jest.Mock).mockReturnValue([
      { name: 'field1', type: 'long' },
      { name: 'field2', type: 'text' },
    ]);

    const strategy = sqlSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      emptyRequestHandlerContext,
      ({
        body: { query: { query: 'SELECT * FROM empty_table', dataset: { id: 'empty-dataset' } } },
      } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
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
});
