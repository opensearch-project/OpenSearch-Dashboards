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
      mockPrometheusClient.getLabels.mockResolvedValue(['job']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['prometheus']);

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
    it('should return metrics with labels using getLabels API', async () => {
      const metrics = ['http_requests_total', 'node_cpu_seconds'];
      const metadata = {
        http_requests_total: [{ type: 'counter', help: 'Total HTTP requests' }],
        node_cpu_seconds: [{ type: 'counter', help: 'CPU seconds' }],
      };

      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue(metadata);
      mockPrometheusClient.getLabels
        .mockResolvedValueOnce(['job', 'instance', 'method'])
        .mockResolvedValueOnce(['job', 'instance', 'cpu']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['val1']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics).toHaveLength(2);
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
      mockPrometheusClient.getLabels
        .mockResolvedValueOnce(['job', 'instance', 'method'])
        .mockResolvedValueOnce(['job', 'instance', 'cpu']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['val1']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelsCommonToAllMetrics).toEqual(expect.arrayContaining(['job', 'instance']));
      expect(result.labelsCommonToAllMetrics).toHaveLength(2);
    });

    it('should fetch label values using getLabelValues API', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['job', 'instance', 'custom_label']);
      mockPrometheusClient.getLabelValues
        .mockResolvedValueOnce(['prometheus', 'node_exporter'])
        .mockResolvedValueOnce(['localhost:9090', 'localhost:9091'])
        .mockResolvedValueOnce(['custom1', 'custom2']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(mockPrometheusClient.getLabelValues).toHaveBeenCalledTimes(3);
      expect(Object.keys(result.labelValues)).toHaveLength(3);
      expect(result.labelValues.job).toEqual(
        expect.arrayContaining(['prometheus', 'node_exporter'])
      );
      expect(result.labelValues.instance).toEqual(
        expect.arrayContaining(['localhost:9090', 'localhost:9091'])
      );
      expect(result.labelValues.custom_label).toEqual(
        expect.arrayContaining(['custom1', 'custom2'])
      );
    });

    it('should limit label values to valuesLimit', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['job']);
      mockPrometheusClient.getLabelValues.mockResolvedValue([
        'v1',
        'v2',
        'v3',
        'v4',
        'v5',
        'v6',
        'v7',
      ]);

      const result = await handlers.searchPrometheusMetadata({});

      // Default valuesLimit is 3
      expect(result.labelValues.job).toHaveLength(3);
    });

    it('should filter metrics by query (case-insensitive)', async () => {
      const metrics = ['http_requests_total', 'http_errors_total', 'node_cpu_seconds'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['job']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['prometheus']);

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
      mockPrometheusClient.getLabels.mockResolvedValue(['job']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['prometheus']);

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
      mockPrometheusClient.getLabels.mockResolvedValue([]);
      mockPrometheusClient.getLabelValues.mockResolvedValue([]);

      const result = await handlers.searchPrometheusMetadata({ query: '[invalid' });

      expect(result.metrics).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const metrics = ['metric1', 'metric2', 'metric3', 'metric4', 'metric5'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['job']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['prometheus']);

      const result = await handlers.searchPrometheusMetadata({ metricsLimit: 3 });

      expect(result.metrics).toHaveLength(3);
    });

    it('should default to limit of 10', async () => {
      const metrics = Array.from({ length: 30 }, (_, i) => `metric_${i}`);
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue([]);
      mockPrometheusClient.getLabelValues.mockResolvedValue([]);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics).toHaveLength(10);
    });

    it('should include metadata when available', async () => {
      const metrics = ['http_requests_total'];
      const metadata = {
        http_requests_total: [{ type: 'counter', help: 'Total HTTP requests' }],
      };
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue(metadata);
      mockPrometheusClient.getLabels.mockResolvedValue(['job']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['prometheus']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics[0].type).toBe('counter');
      expect(result.metrics[0].help).toBe('Total HTTP requests');
    });

    it('should handle missing metadata gracefully', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['unknown_metric']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue([]);

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

    it('should handle getLabels errors gracefully', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1', 'metric2']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockRejectedValue(new Error('Labels error'));

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].labels).toEqual([]);
      expect(result.metrics[1].labels).toEqual([]);
      expect(result.labelValues).toEqual({});
    });

    it('should apply filter before limit', async () => {
      const metrics = ['a_metric', 'b_metric', 'a_another', 'a_third', 'b_other'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue([]);

      const result = await handlers.searchPrometheusMetadata({ query: 'a_', metricsLimit: 2 });

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].name).toBe('a_metric');
      expect(result.metrics[1].name).toBe('a_another');
    });

    it('should fetch label values for all discovered labels', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['custom_label1', 'custom_label2']);
      mockPrometheusClient.getLabelValues
        .mockResolvedValueOnce(['val1', 'val3'])
        .mockResolvedValueOnce(['val2', 'val4']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(mockPrometheusClient.getLabelValues).toHaveBeenCalledTimes(2);
      expect(result.labelValues.custom_label1).toEqual(expect.arrayContaining(['val1', 'val3']));
      expect(result.labelValues.custom_label2).toEqual(expect.arrayContaining(['val2', 'val4']));
    });

    it('should return empty labelsCommonToAllMetrics when metrics have no overlapping labels', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1', 'metric2']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels
        .mockResolvedValueOnce(['label_a', 'label_b'])
        .mockResolvedValueOnce(['label_c', 'label_d']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['val']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelsCommonToAllMetrics).toEqual([]);
    });

    it('should return all labels as shared when only one metric', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['job', 'instance', 'custom']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['value']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelsCommonToAllMetrics).toEqual(
        expect.arrayContaining(['job', 'instance', 'custom'])
      );
      expect(result.labelsCommonToAllMetrics).toHaveLength(3);
    });

    it('should call getLabels for each metric', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1', 'metric2']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue([]);

      await handlers.searchPrometheusMetadata({});

      expect(mockPrometheusClient.getLabels).toHaveBeenCalledTimes(2);
      expect(mockPrometheusClient.getLabels).toHaveBeenCalledWith(
        testDataSourceName,
        testDataSourceMeta,
        'metric1',
        mockTimeRange
      );
      expect(mockPrometheusClient.getLabels).toHaveBeenCalledWith(
        testDataSourceName,
        testDataSourceMeta,
        'metric2',
        mockTimeRange
      );
    });

    it('should filter out __name__ from labels', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['__name__', 'job', 'instance']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['val']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.labelsCommonToAllMetrics).toEqual(expect.arrayContaining(['job', 'instance']));
      expect(result.labelsCommonToAllMetrics).not.toContain('__name__');
    });

    it('should call getLabels for many metrics with concurrency limit', async () => {
      const metrics = Array.from({ length: 8 }, (_, i) => `metric_${i}`);
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['job']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['prometheus']);

      await handlers.searchPrometheusMetadata({});

      expect(mockPrometheusClient.getLabels).toHaveBeenCalledTimes(8);
    });

    it('should combine labels from multiple metrics', async () => {
      const metrics = ['metric_0', 'metric_1'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels
        .mockResolvedValueOnce(['label_a', 'label_b'])
        .mockResolvedValueOnce(['label_a', 'label_c']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['val']);

      const result = await handlers.searchPrometheusMetadata({});

      expect(result.metrics).toHaveLength(2);
      expect(result.labelsCommonToAllMetrics).toEqual(['label_a']);
      expect(result.metrics[0].labels).toEqual(['label_b']);
      expect(result.metrics[1].labels).toEqual(['label_c']);
    });

    it('should not call getSeries API', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});
      mockPrometheusClient.getLabels.mockResolvedValue(['job', 'instance']);
      mockPrometheusClient.getLabelValues.mockResolvedValue(['val']);

      await handlers.searchPrometheusMetadata({});

      // getLabels + getLabelValues are used instead of getSeries
      expect(mockPrometheusClient.getLabels).toHaveBeenCalled();
      expect(mockPrometheusClient.getLabelValues).toHaveBeenCalled();
    });
  });
});
