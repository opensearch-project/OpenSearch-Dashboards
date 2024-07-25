/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { sqlSearchStrategyProvider } from './sql_search_strategy';
import { Observable, of } from 'rxjs';
import {
  SharedGlobalConfig,
  Logger,
  ILegacyClusterClient,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';
import { SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrameError,
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
} from '../../../data/common';
import * as facet from '../utils/facet';

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

    const strategy = sqlSearchStrategyProvider(config$, logger, client, usage);
    const result = await strategy.search(
      emptyRequestHandlerContext,
      ({
        body: { query: { qs: 'SELECT * FROM table' }, df: { name: 'table' } },
      } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(result).toEqual({
      type: DATA_FRAME_TYPES.DEFAULT,
      body: {
        name: 'table',
        fields: [
          { name: 'field1', type: 'long', values: [1, 2] },
          { name: 'field2', type: 'text', values: ['value1', 'value2'] },
        ],
        size: 2,
      },
      took: 100,
    } as IDataFrameResponse);
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
    const result = await strategy.search(
      emptyRequestHandlerContext,
      ({
        body: { query: { qs: 'SELECT * FROM table' } },
      } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
      {}
    );

    expect(result).toEqual(({
      type: DATA_FRAME_TYPES.DEFAULT,
      body: { error: { cause: 'Query failed' } },
      took: 50,
    } as unknown) as IDataFrameError);
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
          body: { query: { qs: 'SELECT * FROM table' } },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrow(mockError);
    expect(logger.error).toHaveBeenCalledWith(`sqlSearchStrategy: ${mockError.message}`);
    expect(usage.trackError).toHaveBeenCalled();
  });
});
