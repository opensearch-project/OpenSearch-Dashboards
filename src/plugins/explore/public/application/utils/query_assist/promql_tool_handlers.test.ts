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
    } as unknown) as DataPublicPluginStart;

    handlers = new PromQLToolHandlers(mockData, testDataSourceName);
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

      expect(() => new PromQLToolHandlers(mockDataWithoutClient, testDataSourceName)).toThrow(
        'Prometheus resource client not found'
      );
    });
  });

  describe('setDataSourceName', () => {
    it('should update the data source name', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      handlers.setDataSourceName('new-datasource');
      await handlers.searchMetrics({});

      expect(mockPrometheusClient.getMetrics).toHaveBeenCalledWith('new-datasource');
    });
  });

  describe('executeTool', () => {
    it('should execute search_metrics tool', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['metric1']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.executeTool('search_metrics', { query: 'test' });

      expect(result).toHaveProperty('metrics');
    });

    it('should execute search_labels tool', async () => {
      mockPrometheusClient.getLabels.mockResolvedValue(['label1']);

      const result = await handlers.executeTool('search_labels', { metric: 'test' });

      expect(result).toHaveProperty('labels');
    });

    it('should execute search_label_values tool', async () => {
      mockPrometheusClient.getLabelValues.mockResolvedValue(['value1']);

      const result = await handlers.executeTool('search_label_values', { label: 'job' });

      expect(result).toHaveProperty('values');
    });
  });

  describe('searchMetrics', () => {
    it('should return all metrics when no query provided', async () => {
      const metrics = ['http_requests_total', 'node_cpu_seconds', 'up'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchMetrics({});

      expect(mockPrometheusClient.getMetrics).toHaveBeenCalledWith(testDataSourceName);
      expect(result.metrics).toHaveLength(3);
      expect(result.metrics.map((m) => m.name)).toEqual(metrics);
    });

    it('should filter metrics by query (case-insensitive)', async () => {
      const metrics = ['http_requests_total', 'http_errors_total', 'node_cpu_seconds'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchMetrics({ query: 'HTTP' });

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics.map((m) => m.name)).toEqual([
        'http_requests_total',
        'http_errors_total',
      ]);
    });

    it('should respect limit parameter', async () => {
      const metrics = ['metric1', 'metric2', 'metric3', 'metric4', 'metric5'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchMetrics({ limit: 3 });

      expect(result.metrics).toHaveLength(3);
    });

    it('should default to limit of 100', async () => {
      const metrics = Array.from({ length: 150 }, (_, i) => `metric_${i}`);
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchMetrics({});

      expect(result.metrics).toHaveLength(100);
    });

    it('should include metadata when available', async () => {
      const metrics = ['http_requests_total'];
      const metadata = {
        http_requests_total: [{ type: 'counter', help: 'Total HTTP requests' }],
      };
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue(metadata);

      const result = await handlers.searchMetrics({});

      expect(result.metrics[0]).toEqual({
        name: 'http_requests_total',
        type: 'counter',
        help: 'Total HTTP requests',
      });
    });

    it('should handle missing metadata gracefully', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(['unknown_metric']);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchMetrics({});

      expect(result.metrics[0]).toEqual({
        name: 'unknown_metric',
        type: undefined,
        help: undefined,
      });
    });

    it('should return empty array on error', async () => {
      mockPrometheusClient.getMetrics.mockRejectedValue(new Error('Network error'));

      const result = await handlers.searchMetrics({});

      expect(result.metrics).toEqual([]);
    });

    it('should handle null metrics response', async () => {
      mockPrometheusClient.getMetrics.mockResolvedValue(null);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchMetrics({});

      expect(result.metrics).toEqual([]);
    });

    it('should apply filter before limit', async () => {
      const metrics = ['a_metric', 'b_metric', 'a_another', 'a_third', 'b_other'];
      mockPrometheusClient.getMetrics.mockResolvedValue(metrics);
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({});

      const result = await handlers.searchMetrics({ query: 'a_', limit: 2 });

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].name).toBe('a_metric');
      expect(result.metrics[1].name).toBe('a_another');
    });
  });

  describe('searchLabels', () => {
    it('should return all labels when no metric provided', async () => {
      const labels = ['job', 'instance', 'namespace'];
      mockPrometheusClient.getLabels.mockResolvedValue(labels);

      const result = await handlers.searchLabels({});

      expect(mockPrometheusClient.getLabels).toHaveBeenCalledWith(testDataSourceName, undefined);
      expect(result.labels).toEqual(labels);
    });

    it('should filter labels by metric', async () => {
      const labels = ['job', 'instance'];
      mockPrometheusClient.getLabels.mockResolvedValue(labels);

      const result = await handlers.searchLabels({ metric: 'http_requests_total' });

      expect(mockPrometheusClient.getLabels).toHaveBeenCalledWith(
        testDataSourceName,
        'http_requests_total'
      );
      expect(result.labels).toEqual(labels);
    });

    it('should return empty array on error', async () => {
      mockPrometheusClient.getLabels.mockRejectedValue(new Error('Network error'));

      const result = await handlers.searchLabels({});

      expect(result.labels).toEqual([]);
    });

    it('should handle null labels response', async () => {
      mockPrometheusClient.getLabels.mockResolvedValue(null);

      const result = await handlers.searchLabels({});

      expect(result.labels).toEqual([]);
    });
  });

  describe('searchLabelValues', () => {
    it('should return values for specified label', async () => {
      const values = ['prometheus', 'grafana', 'alertmanager'];
      mockPrometheusClient.getLabelValues.mockResolvedValue(values);

      const result = await handlers.searchLabelValues({ label: 'job' });

      expect(mockPrometheusClient.getLabelValues).toHaveBeenCalledWith(testDataSourceName, 'job');
      expect(result.values).toEqual(values);
    });

    it('should throw error when label is not provided', async () => {
      await expect(handlers.searchLabelValues({} as any)).rejects.toThrow('Label name is required');
    });

    it('should return empty array on error', async () => {
      mockPrometheusClient.getLabelValues.mockRejectedValue(new Error('Network error'));

      const result = await handlers.searchLabelValues({ label: 'job' });

      expect(result.values).toEqual([]);
    });

    it('should handle null values response', async () => {
      mockPrometheusClient.getLabelValues.mockResolvedValue(null);

      const result = await handlers.searchLabelValues({ label: 'job' });

      expect(result.values).toEqual([]);
    });
  });
});
