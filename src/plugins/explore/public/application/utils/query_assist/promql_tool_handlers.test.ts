/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromQLToolHandlers } from './promql_tool_handlers';
import { DataPublicPluginStart } from '../../../../../data/public';

describe('PromQLToolHandlers', () => {
  let mockPrometheusClient: {
    getMetrics: jest.Mock;
    getMetricMetadata: jest.Mock;
    getLabels: jest.Mock;
    getLabelValues: jest.Mock;
    getSeries: jest.Mock;
  };

  let mockData: DataPublicPluginStart;
  let handlers: PromQLToolHandlers;
  const testDataSourceName = 'test-datasource';
  const testDataSourceMeta = { prometheusUrl: 'http://localhost:9090' };
  const mockTimeRange = { from: 'now-15m', to: 'now' };

  beforeEach(() => {
    mockPrometheusClient = {
      getMetrics: jest.fn(),
      getMetricMetadata: jest.fn(),
      getLabels: jest.fn(),
      getLabelValues: jest.fn(),
      getSeries: jest.fn(),
    };

    mockData = ({
      resourceClientFactory: {
        get: jest.fn().mockReturnValue(mockPrometheusClient),
      },
      query: {
        timefilter: {
          timefilter: {
            getTime: jest.fn().mockReturnValue(mockTimeRange),
          },
        },
      },
    } as unknown) as DataPublicPluginStart;

    handlers = new PromQLToolHandlers(mockData, testDataSourceName, testDataSourceMeta);
  });

  describe('constructor', () => {
    it('should create instance with valid prometheus client', () => {
      expect(handlers).toBeDefined();
      expect(mockData.resourceClientFactory.get).toHaveBeenCalledWith('prometheus');
    });

    it('should throw error when prometheus client not found', () => {
      const mockDataWithoutClient = ({
        resourceClientFactory: {
          get: jest.fn().mockReturnValue(undefined),
        },
      } as unknown) as DataPublicPluginStart;

      expect(
        () => new PromQLToolHandlers(mockDataWithoutClient, testDataSourceName, testDataSourceMeta)
      ).toThrow('Prometheus resource client not found');
    });

    it('should accept optional dataSourceMeta parameter', () => {
      const handlersWithoutMeta = new PromQLToolHandlers(mockData, testDataSourceName);
      expect(handlersWithoutMeta).toBeDefined();
    });
  });

  describe('executeTool', () => {
    it('should execute search_prometheus_metadata tool', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', job: 'prometheus' },
      ]);

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = await handlers.executeTool('search_prometheus_metadata', { query: 'test' });

      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('labelsCommonToAllMetrics');
      expect(result).toHaveProperty('labelValues');
    });

    it('should throw error for unknown tool', async () => {
      await expect(handlers.executeTool('unknown_tool' as any, {})).rejects.toThrow(
        'Unknown tool: unknown_tool'
      );
    });
  });

  describe('searchPrometheusMetadata', () => {
    it('should return metrics with labels in one call', async () => {
      const metrics = ['http_requests_total', 'node_cpu_seconds'];
      const metadata = {
        http_requests_total: [{ type: 'counter', help: 'Total HTTP requests' }],
        node_cpu_seconds: [{ type: 'counter', help: 'CPU seconds' }],
      };

      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue(metadata);
      // Series API returns label sets for each series
      mockPrometheusClient.getSeries.mockResolvedValue([
        {
          __name__: 'http_requests_total',
          job: 'prometheus',
          instance: 'localhost',
          method: 'GET',
        },
        { __name__: 'node_cpu_seconds', job: 'prometheus', instance: 'localhost', cpu: '0' },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics).toHaveLength(2);
      // Shared labels (job, instance) are extracted, only unique labels remain
      expect(result.metrics[0]).toEqual({
        name: 'http_requests_total',
        type: 'counter',
        help: 'Total HTTP requests',
        labels: ['method'],
      });
      expect(result.metrics[1]).toEqual({
        name: 'node_cpu_seconds',
        type: 'counter',
        help: 'CPU seconds',
        labels: ['cpu'],
      });
      expect(result.labelsCommonToAllMetrics).toEqual(expect.arrayContaining(['job', 'instance']));
    });

    it('should compute shared labels as intersection', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1', 'metric2']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', job: 'prometheus', instance: 'localhost', method: 'GET' },
        { __name__: 'metric2', job: 'prometheus', instance: 'localhost', cpu: '0' },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelsCommonToAllMetrics).toEqual(expect.arrayContaining(['job', 'instance']));
      expect(result.labelsCommonToAllMetrics).toHaveLength(2);
    });

    it('should extract label values from series data', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      // Series data contains label values
      mockPrometheusClient.getSeries.mockResolvedValue([
        {
          __name__: 'metric1',
          job: 'prometheus',
          instance: 'localhost:9090',
          custom_label: 'custom1',
        },
        {
          __name__: 'metric1',
          job: 'prometheus',
          instance: 'localhost:9091',
          custom_label: 'custom2',
        },
        {
          __name__: 'metric1',
          job: 'node_exporter',
          instance: 'localhost:9100',
          custom_label: 'custom1',
        },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      // Label values should be extracted from series data (no getLabelValues calls)
      expect(mockPrometheusClient.getLabelValues).not.toHaveBeenCalled();
      expect(Object.keys(result.labelValues)).toHaveLength(3);
      // Values should be unique and from series data
      expect(result.labelValues.job).toEqual(
        expect.arrayContaining(['prometheus', 'node_exporter'])
      );
      expect(result.labelValues.instance).toEqual(
        expect.arrayContaining(['localhost:9090', 'localhost:9091', 'localhost:9100'])
      );
      expect(result.labelValues.custom_label).toEqual(
        expect.arrayContaining(['custom1', 'custom2'])
      );
    });

    it('should limit label values to 5', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      // Create series with more than 5 unique values for job label
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', job: 'v1' },
        { __name__: 'metric1', job: 'v2' },
        { __name__: 'metric1', job: 'v3' },
        { __name__: 'metric1', job: 'v4' },
        { __name__: 'metric1', job: 'v5' },
        { __name__: 'metric1', job: 'v6' },
        { __name__: 'metric1', job: 'v7' },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelValues.job).toHaveLength(5);
    });

    it('should filter metrics by query (case-insensitive)', async () => {
      const metrics = ['http_requests_total', 'http_errors_total', 'node_cpu_seconds'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'http_requests_total', job: 'prometheus' },
        { __name__: 'http_errors_total', job: 'prometheus' },
      ]);

      const result = await handlers.searchPrometheusMetadata({ query: 'HTTP' });

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics.map((m) => m.name)).toEqual([
        'http_requests_total',
        'http_errors_total',
      ]);
    });

    it('should support regex query to match multiple patterns', async () => {
      const metrics = [
        'http_requests_total',
        'node_cpu_seconds',
        'node_memory_bytes',
        'process_cpu_seconds',
      ];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'node_cpu_seconds', job: 'prometheus' },
        { __name__: 'node_memory_bytes', job: 'prometheus' },
        { __name__: 'process_cpu_seconds', job: 'prometheus' },
      ]);

      // Match both cpu and memory metrics
      const result = await handlers.searchPrometheusMetadata({ query: 'cpu|memory' });

      expect(result.metrics).toHaveLength(3);
      expect(result.metrics.map((m) => m.name)).toEqual([
        'node_cpu_seconds',
        'node_memory_bytes',
        'process_cpu_seconds',
      ]);
    });

    it('should fall back to substring matching for invalid regex', async () => {
      const metrics = ['http_requests_total', 'http_errors_total', 'node_cpu_seconds'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([]);

      // Invalid regex pattern - should fall back to substring
      const result = await handlers.searchPrometheusMetadata({ query: '[invalid' });

      // Falls back to substring matching, which matches nothing
      expect(result.metrics).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const metrics = ['metric1', 'metric2', 'metric3', 'metric4', 'metric5'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', job: 'prometheus' },
        { __name__: 'metric2', job: 'prometheus' },
        { __name__: 'metric3', job: 'prometheus' },
      ]);

      const result = await handlers.searchPrometheusMetadata({ metricsLimit: 3 });

      expect(result.metrics).toHaveLength(3);
    });

    it('should default to limit of 20', async () => {
      const metrics = Array.from({ length: 30 }, (_, i) => `metric_${i}`);
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics).toHaveLength(20);
    });

    it('should include metadata when available', async () => {
      const metrics = ['http_requests_total'];
      const metadata = {
        http_requests_total: [{ type: 'counter', help: 'Total HTTP requests' }],
      };
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue(metadata);
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'http_requests_total', job: 'prometheus' },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics[0].type).toBe('counter');
      expect(result.metrics[0].help).toBe('Total HTTP requests');
    });

    it('should handle missing metadata gracefully', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['unknown_metric']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics[0]).toEqual({
        name: 'unknown_metric',
        type: undefined,
        help: undefined,
        labels: [],
      });
    });

    it('should return empty result on error', async () => {
      mockPrometheusClient.getMetrics.mockRejectedValue(new Error('Network error'));

      const result = await handlers.searchPrometheusMetadata({});

      expect(result).toEqual({ metrics: [], labelsCommonToAllMetrics: [], labelValues: {} });
    });

    it('should handle null metrics response', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(null);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchPrometheusMetadata({});

      expect(result).toEqual({ metrics: [], labelsCommonToAllMetrics: [], labelValues: {} });
    });

    it('should handle series fetch errors gracefully', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1', 'metric2']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockRejectedValue(new Error('Series error'));

      const result = await handlers.searchPrometheusMetadata({});

      // Should return metrics but with no labels (series API failed)
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].labels).toEqual([]);
      expect(result.metrics[1].labels).toEqual([]);
      expect(result.labelValues).toEqual({});
    });

    it('should apply filter before limit', async () => {
      const metrics = ['a_metric', 'b_metric', 'a_another', 'a_third', 'b_other'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([]);

      const result = await handlers.searchPrometheusMetadata({ query: 'a_', metricsLimit: 2 });

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].name).toBe('a_metric');
      expect(result.metrics[1].name).toBe('a_another');
    });

    it('should extract label values for custom labels from series data', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', custom_label1: 'val1', custom_label2: 'val2' },
        { __name__: 'metric1', custom_label1: 'val3', custom_label2: 'val4' },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      // Should NOT call getLabelValues - values come from series data
      expect(mockPrometheusClient.getLabelValues).not.toHaveBeenCalled();
      expect(result.labelValues.custom_label1).toEqual(expect.arrayContaining(['val1', 'val3']));
      expect(result.labelValues.custom_label2).toEqual(expect.arrayContaining(['val2', 'val4']));
    });

    it('should return empty labelsCommonToAllMetrics when metrics have no overlapping labels', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1', 'metric2']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', label_a: 'a', label_b: 'b' },
        { __name__: 'metric2', label_c: 'c', label_d: 'd' },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelsCommonToAllMetrics).toEqual([]);
    });

    it('should return all labels as shared when only one metric', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', job: 'prometheus', instance: 'localhost', custom: 'value' },
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelsCommonToAllMetrics).toEqual(
        expect.arrayContaining(['job', 'instance', 'custom'])
      );
      expect(result.labelsCommonToAllMetrics).toHaveLength(3);
    });

    it('should call getSeries with correct match selector', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1', 'metric2']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([]);

      await handlers.searchPrometheusMetadata({});

      // Should be called with match selector for all metrics (in single batch since < 10)
      expect(mockPrometheusClient.getSeries).toHaveBeenCalledWith(
        testDataSourceName,
        '{__name__=~"metric1|metric2"}',
        testDataSourceMeta,
        mockTimeRange
      );
    });

    it('should escape special regex characters in metric names', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric.name', 'metric+plus']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([]);

      await handlers.searchPrometheusMetadata({});

      // Should escape . and + characters
      expect(mockPrometheusClient.getSeries).toHaveBeenCalledWith(
        testDataSourceName,
        '{__name__=~"metric\\.name|metric\\+plus"}',
        testDataSourceMeta,
        mockTimeRange
      );
    });

    it('should batch series API calls when many metrics', async () => {
      // Create 15 metrics (more than batch size of 10)
      const metrics = Array.from({ length: 15 }, (_, i) => `metric_${i}`);
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([]);

      await handlers.searchPrometheusMetadata({});

      // Should be called twice (batch of 10 + batch of 5)
      expect(mockPrometheusClient.getSeries).toHaveBeenCalledTimes(2);
      // First batch: metrics 0-9
      expect(mockPrometheusClient.getSeries).toHaveBeenCalledWith(
        testDataSourceName,
        '{__name__=~"metric_0|metric_1|metric_2|metric_3|metric_4|metric_5|metric_6|metric_7|metric_8|metric_9"}',
        testDataSourceMeta,
        mockTimeRange
      );
      // Second batch: metrics 10-14
      expect(mockPrometheusClient.getSeries).toHaveBeenCalledWith(
        testDataSourceName,
        '{__name__=~"metric_10|metric_11|metric_12|metric_13|metric_14"}',
        testDataSourceMeta,
        mockTimeRange
      );
    });

    it('should combine series results from multiple batches', async () => {
      // Create 12 metrics
      const metrics = Array.from({ length: 12 }, (_, i) => `metric_${i}`);
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      // First batch returns some series
      mockPrometheusClient.getSeries
        .mockResolvedValueOnce([
          { __name__: 'metric_0', label_a: 'value0' },
          { __name__: 'metric_1', label_a: 'value1' },
        ])
        // Second batch returns more series
        .mockResolvedValueOnce([
          { __name__: 'metric_10', label_a: 'value10' },
          { __name__: 'metric_11', label_a: 'value11' },
        ]);

      const result = await handlers.searchPrometheusMetadata({});

      // All metrics should be in the result
      expect(result.metrics).toHaveLength(12);
      // Label values should be combined from both batches
      expect(result.labelValues.label_a).toEqual(
        expect.arrayContaining(['value0', 'value1', 'value10', 'value11'])
      );
    });

    it('should not call getLabelValues API', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getSeries.mockResolvedValue([
        { __name__: 'metric1', job: 'prometheus', instance: 'localhost' },
      ]);

      await handlers.searchPrometheusMetadata({});

      // Should never call getLabelValues - all data comes from series API
      expect(mockPrometheusClient.getLabelValues).not.toHaveBeenCalled();
    });
  });
});
