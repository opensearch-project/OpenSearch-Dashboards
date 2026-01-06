/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, RequestHandlerContext, SharedGlobalConfig } from 'opensearch-dashboards/server';
import { Observable, of } from 'rxjs';
import { DATA_FRAME_TYPES, IOpenSearchDashboardsSearchRequest } from '../../../data/common';
import { SearchUsage } from '../../../data/server';
import { promqlSearchStrategyProvider } from './promql_search_strategy';
import { prometheusManager } from '../connections/managers/prometheus_manager';

jest.mock('../connections/managers/prometheus_manager', () => ({
  prometheusManager: {
    query: jest.fn(),
  },
}));

describe('promqlSearchStrategy', () => {
  let config$: Observable<SharedGlobalConfig>;
  let logger: Logger;
  let usage: SearchUsage;
  const emptyRequestHandlerContext = ({} as unknown) as RequestHandlerContext;

  const mockPrometheusManagerQuery = (mockResponse: any) => {
    (prometheusManager.query as jest.Mock).mockResolvedValue({
      status: 'success',
      data: mockResponse,
    });
  };

  beforeEach(() => {
    config$ = of({} as SharedGlobalConfig);
    logger = ({
      error: jest.fn(),
    } as unknown) as Logger;
    usage = ({
      trackSuccess: jest.fn(),
      trackError: jest.fn(),
    } as unknown) as SearchUsage;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDataFrame transformation', () => {
    it('should transform prometheus response with multiple series correctly', async () => {
      const mockPrometheusResponse = {
        queryId: 'query-1',
        sessionId: 'session-1',
        results: {
          'dataset-1': {
            resultType: 'matrix',
            result: [
              {
                metric: { cpu: '0', mode: 'idle' },
                values: [
                  [1638316800, 0.95],
                  [1638316860, 0.96],
                ],
              },
              {
                metric: { cpu: '1', mode: 'idle' },
                values: [
                  [1638316800, 0.92],
                  [1638316860, 0.93],
                ],
              },
            ],
          },
        },
      };

      mockPrometheusManagerQuery(mockPrometheusResponse);
      const strategy = promqlSearchStrategyProvider(config$, logger, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: {
              query: 'node_cpu_seconds_total',
              dataset: { id: 'dataset-1' },
              language: 'PROMQL',
            },
            timeRange: {
              from: '2021-12-01T00:00:00.000Z',
              to: '2021-12-01T01:00:00.000Z',
            },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(result.type).toBe(DATA_FRAME_TYPES.DEFAULT);
      expect(result.body.name).toBe('dataset-1');

      // Check visualization schema (Time, Series, Value)
      expect(result.body.schema).toEqual([
        { name: 'Time', type: 'time', values: [] },
        { name: 'Series', type: 'string', values: [] },
        { name: 'Value', type: 'number', values: [] },
      ]);

      // Check fields contain visualization data
      expect(result.body.fields.length).toBe(3);
      expect(result.body.fields[0].name).toBe('Time');
      expect(result.body.fields[1].name).toBe('Series');
      expect(result.body.fields[2].name).toBe('Value');

      // Verify we have 4 rows total (2 series * 2 timestamps)
      expect(result.body.size).toBe(4);

      // Check instant data in meta
      expect(result.body.meta?.instantData).toBeDefined();
      expect(result.body.meta?.instantData.rows).toBeDefined();

      // Instant data should only have latest timestamp (1638316860)
      const instantRows = result.body.meta?.instantData.rows;
      expect(instantRows.length).toBe(2);
      expect(instantRows[0].Time).toBe(1638316860000);
      expect(instantRows[1].Time).toBe(1638316860000);
    });

    it('should handle empty prometheus response', async () => {
      const mockPrometheusResponse = {
        queryId: 'query-1',
        sessionId: 'session-1',
        results: {
          'dataset-1': {
            resultType: 'matrix',
            result: [],
          },
        },
      };

      mockPrometheusManagerQuery(mockPrometheusResponse);
      const strategy = promqlSearchStrategyProvider(config$, logger, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: {
              query: 'empty_metric',
              dataset: { id: 'dataset-1' },
              language: 'PROMQL',
            },
            timeRange: {
              from: '2021-12-01T00:00:00.000Z',
              to: '2021-12-01T01:00:00.000Z',
            },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      expect(result.body.size).toBe(0);
      expect(result.body.fields[0].values.length).toBe(0);
    });

    it('should format series names with labels correctly', async () => {
      const mockPrometheusResponse = {
        queryId: 'query-1',
        sessionId: 'session-1',
        results: {
          'dataset-1': {
            resultType: 'matrix',
            result: [
              {
                metric: { instance: 'localhost:9090', job: 'prometheus' },
                values: [[1638316800, 42.5]],
              },
            ],
          },
        },
      };

      mockPrometheusManagerQuery(mockPrometheusResponse);
      const strategy = promqlSearchStrategyProvider(config$, logger, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: {
              query: 'up',
              dataset: { id: 'dataset-1' },
              language: 'PROMQL',
            },
            timeRange: {
              from: '2021-12-01T00:00:00.000Z',
              to: '2021-12-01T01:00:00.000Z',
            },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      // Check that series name is formatted as {label1="value1", label2="value2"}
      const seriesField = result.body.fields.find((f) => f.name === 'Series');
      expect(seriesField).toBeDefined();
      expect(seriesField?.values[0]).toContain('instance="localhost:9090"');
      expect(seriesField?.values[0]).toContain('job="prometheus"');
    });

    it('should create instant schema with all label keys', async () => {
      const mockPrometheusResponse = {
        queryId: 'query-1',
        sessionId: 'session-1',
        results: {
          'dataset-1': {
            resultType: 'matrix',
            result: [
              {
                metric: { cpu: '0', mode: 'idle', host: 'server1' },
                values: [[1638316800, 0.95]],
              },
              {
                metric: { cpu: '1', mode: 'user', host: 'server1' },
                values: [[1638316800, 0.85]],
              },
            ],
          },
        },
      };

      mockPrometheusManagerQuery(mockPrometheusResponse);
      const strategy = promqlSearchStrategyProvider(config$, logger, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: {
              query: 'node_cpu',
              dataset: { id: 'dataset-1' },
              language: 'PROMQL',
            },
            timeRange: {
              from: '2021-12-01T00:00:00.000Z',
              to: '2021-12-01T01:00:00.000Z',
            },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      const instantSchema = result.body.meta?.instantData.schema;
      expect(instantSchema).toBeDefined();

      // Should have Time, cpu, host, mode, Value (sorted alphabetically)
      const schemaNames = instantSchema.map((s: any) => s.name);
      expect(schemaNames).toEqual(['Time', 'Metric', 'cpu', 'host', 'mode', 'Value']);
    });

    it('should handle metrics with missing labels', async () => {
      const mockPrometheusResponse = {
        queryId: 'query-1',
        sessionId: 'session-1',
        results: {
          'dataset-1': {
            resultType: 'matrix',
            result: [
              {
                metric: { cpu: '0' },
                values: [[1638316800, 0.95]],
              },
              {
                metric: { cpu: '1', mode: 'idle' },
                values: [[1638316800, 0.92]],
              },
            ],
          },
        },
      };

      mockPrometheusManagerQuery(mockPrometheusResponse);
      const strategy = promqlSearchStrategyProvider(config$, logger, usage);
      const result = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: {
              query: 'test_metric',
              dataset: { id: 'dataset-1' },
              language: 'PROMQL',
            },
            timeRange: {
              from: '2021-12-01T00:00:00.000Z',
              to: '2021-12-01T01:00:00.000Z',
            },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      // Instant rows should handle missing labels with empty strings
      const instantRows = result.body.meta?.instantData.rows;
      expect(instantRows[0].mode).toBe('');
      expect(instantRows[1].mode).toBe('idle');
    });

    it('should respect MAX_SERIES limit', async () => {
      // Create more than MAX_SERIES (2000) series
      const resultSeries = Array.from({ length: 2500 }, (_, i) => ({
        metric: { series: `series-${i}` },
        values: [[1638316800, i]],
      }));

      const mockPrometheusResponse = {
        queryId: 'query-1',
        sessionId: 'session-1',
        results: {
          'dataset-1': {
            resultType: 'matrix',
            result: resultSeries,
          },
        },
      };

      mockPrometheusManagerQuery(mockPrometheusResponse);
      const strategy = promqlSearchStrategyProvider(config$, logger, usage);
      const resultData = await strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: {
              query: 'many_series',
              dataset: { id: 'dataset-1' },
              language: 'PROMQL',
            },
            timeRange: {
              from: '2021-12-01T00:00:00.000Z',
              to: '2021-12-01T01:00:00.000Z',
            },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      );

      // Should only process MAX_SERIES (2000) series
      expect(resultData.body.size).toBe(2000);
      const instantRows = resultData.body.meta?.instantData.rows;
      expect(instantRows.length).toBe(2000);
    });
  });

  it('should handle errors and track usage', async () => {
    (prometheusManager.query as jest.Mock).mockResolvedValue({
      status: 'failed',
      error: 'Query failed',
    });

    const strategy = promqlSearchStrategyProvider(config$, logger, usage);
    await expect(
      strategy.search(
        emptyRequestHandlerContext,
        ({
          body: {
            query: { query: 'failing_query', dataset: { id: 'dataset-1' } },
            timeRange: {
              from: '2021-12-01T00:00:00.000Z',
              to: '2021-12-01T01:00:00.000Z',
            },
          },
        } as unknown) as IOpenSearchDashboardsSearchRequest<unknown>,
        {}
      )
    ).rejects.toThrow('Query failed');
    expect(usage.trackError).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
