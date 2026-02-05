/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { URI, RESOURCE_TYPES } from '../../../common/constants';
import { prometheusManager, PromQLQueryParams, PromQLQueryResponse } from './prometheus_manager';
import { QueryExecutor } from './base_connection_manager';

describe('PrometheusManager', () => {
  let mockContext: RequestHandlerContext;
  let mockRequest: OpenSearchDashboardsRequest;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      transport: {
        request: jest.fn(),
      },
    };

    mockContext = ({
      core: {
        opensearch: {
          client: {
            asCurrentUser: mockClient,
          },
        },
      },
    } as unknown) as RequestHandlerContext;

    mockRequest = ({} as unknown) as OpenSearchDashboardsRequest;
  });

  describe('getResources', () => {
    it('should fetch labels', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['__name__', 'instance', 'job'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.LABELS,
        query: {},
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/labels`,
        querystring: '',
        method: 'GET',
      });
      expect(result).toEqual({
        status: 'success',
        data: ['__name__', 'instance', 'job'],
        type: 'prometheus',
      });
    });

    it('should fetch labels with match parameter', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['cpu', 'mode'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.LABELS,
        resourceName: 'node_cpu_seconds_total',
        query: { 'match[]': 'node_cpu_seconds_total' },
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/labels`,
        querystring: 'match%5B%5D=node_cpu_seconds_total',
        method: 'GET',
      });
      expect(result.status).toBe('success');
    });

    it('should fetch label values', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['prometheus', 'node_exporter'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.LABEL_VALUES,
        resourceName: 'job',
        query: {},
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/label/job/values`,
        querystring: '',
        method: 'GET',
      });
      expect(result.data).toEqual(['prometheus', 'node_exporter']);
    });

    it('should fetch metrics', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['up', 'node_cpu_seconds_total', 'prometheus_http_requests_total'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.METRICS,
        resourceName: undefined,
        query: {},
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/label/__name__/values`,
        querystring: '',
        method: 'GET',
      });
      expect(result.data).toEqual([
        'up',
        'node_cpu_seconds_total',
        'prometheus_http_requests_total',
      ]);
    });

    it('should fetch metric metadata', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: {
            up: [{ type: 'gauge', help: 'Target up status', unit: '' }],
          },
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.METRIC_METADATA,
        query: {},
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/metadata`,
        querystring: '',
        method: 'GET',
      });
      expect(result.data).toEqual({
        up: [{ type: 'gauge', help: 'Target up status', unit: '' }],
      });
    });

    it('should fetch metric metadata with specific metric', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: {
            up: [{ type: 'gauge', help: 'Target up status', unit: '' }],
          },
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.METRIC_METADATA,
        resourceName: 'up',
        query: { metric: 'up' },
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/metadata`,
        querystring: 'metric=up',
        method: 'GET',
      });
    });

    it('should fetch alerts', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: {
            alerts: [{ labels: { alertname: 'TestAlert' }, state: 'firing' }],
          },
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.ALERTS,
        resourceName: undefined,
        query: {},
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/alerts`,
        querystring: '',
        method: 'GET',
      });
    });

    it('should fetch alert manager alert groups', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: [{ labels: { alertname: 'TestAlert' }, alerts: [] }],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.ALERTS_GROUPS,
        resourceName: undefined,
        query: {},
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/alertmanager/api/v2/alerts/groups`,
        querystring: '',
        method: 'GET',
      });
    });

    it('should fetch rules', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: {
            groups: [{ name: 'test-rules', rules: [] }],
          },
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const result = await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.RULES,
        resourceName: undefined,
        query: {},
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/rules`,
        querystring: '',
        method: 'GET',
      });
    });

    it('should include query parameters in querystring', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['label1'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      await prometheusManager.getResources(mockContext, mockRequest, {
        dataSourceName: 'prom-conn',
        resourceType: RESOURCE_TYPES.PROMETHEUS.LABELS,
        query: { start: '1638316800', end: '1638320400' },
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/labels`,
        querystring: 'start=1638316800&end=1638320400',
        method: 'GET',
      });
    });
  });

  describe('handlePostRequest', () => {
    it('should handle POST request and call getResources', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['label1', 'label2'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const postRequest = ({
        body: {
          connection: { id: 'prom-conn' },
          resource: { type: 'labels', name: undefined },
        },
      } as unknown) as OpenSearchDashboardsRequest;

      const result = await prometheusManager.handlePostRequest(mockContext, postRequest as any);

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/labels`,
        querystring: '',
        method: 'GET',
      });
      expect(result.status).toBe('success');
    });

    it('should handle POST request with resourceName', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['value1', 'value2'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const postRequest = ({
        body: {
          connection: { id: 'prom-conn' },
          resource: { type: 'label_values', name: 'job' },
        },
      } as unknown) as OpenSearchDashboardsRequest;

      await prometheusManager.handlePostRequest(mockContext, postRequest as any);

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/label/job/values`,
        querystring: '',
        method: 'GET',
      });
    });

    it('should handle POST request with time range content', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['label1', 'label2'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const postRequest = ({
        body: {
          connection: { id: 'prom-conn' },
          resource: { type: 'labels', name: undefined },
          content: { start: 1638316800, end: 1638320400 },
        },
      } as unknown) as OpenSearchDashboardsRequest;

      await prometheusManager.handlePostRequest(mockContext, postRequest as any);

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/labels`,
        querystring: 'start=1638316800&end=1638320400',
        method: 'GET',
      });
    });

    it('should handle POST request for labels with metric and time range', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['cpu', 'mode'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const postRequest = ({
        body: {
          connection: { id: 'prom-conn' },
          resource: { type: 'labels', name: 'node_cpu_seconds_total' },
          content: { start: 1638316800, end: 1638320400 },
        },
      } as unknown) as OpenSearchDashboardsRequest;

      await prometheusManager.handlePostRequest(mockContext, postRequest as any);

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/labels`,
        querystring: 'match%5B%5D=node_cpu_seconds_total&start=1638316800&end=1638320400',
        method: 'GET',
      });
    });

    it('should handle POST request for metric metadata with metric name and time range', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: { up: [{ type: 'gauge', help: 'Target up status', unit: '' }] },
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const postRequest = ({
        body: {
          connection: { id: 'prom-conn' },
          resource: { type: 'metric_metadata', name: 'up' },
          content: { start: 1638316800, end: 1638320400 },
        },
      } as unknown) as OpenSearchDashboardsRequest;

      await prometheusManager.handlePostRequest(mockContext, postRequest as any);

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: `${URI.DIRECT_QUERY.RESOURCES}/prom-conn/api/v1/metadata`,
        querystring: 'metric=up&start=1638316800&end=1638320400',
        method: 'GET',
      });
    });
  });

  describe('query', () => {
    afterEach(() => {
      // Clean up after each test
      prometheusManager.setQueryExecutor(undefined as any);
    });

    it('should execute query successfully when query executor is set', async () => {
      const mockQueryResponse: PromQLQueryResponse = {
        queryId: 'test-query-id',
        sessionId: 'test-session-id',
        results: {
          'prom-conn': {
            resultType: 'matrix',
            result: [
              {
                metric: { __name__: 'up', job: 'prometheus' },
                values: [[1638316800, 1]],
              },
            ],
          },
        },
      };

      const mockExecutor: QueryExecutor<PromQLQueryParams, PromQLQueryResponse> = {
        execute: jest.fn().mockResolvedValue(mockQueryResponse),
      };
      prometheusManager.setQueryExecutor(mockExecutor);

      const params: PromQLQueryParams = {
        body: {
          query: 'up',
          language: 'promql',
          maxResults: 100,
          timeout: 30,
          options: {
            queryType: 'instant',
            start: '2021-12-01T00:00:00Z',
            end: '2021-12-01T01:00:00Z',
            step: '15s',
          },
        },
        dataconnection: 'prom-conn',
      };

      const result = await prometheusManager.query(mockContext, mockRequest, params);

      expect(mockExecutor.execute).toHaveBeenCalledWith(mockContext, mockRequest, params);
      expect(result).toEqual(mockQueryResponse);
    });

    it('should throw error when query executor throws error', async () => {
      const mockExecutor: QueryExecutor<PromQLQueryParams, PromQLQueryResponse> = {
        execute: jest.fn().mockRejectedValue(new Error('Query timeout')),
      };
      prometheusManager.setQueryExecutor(mockExecutor);

      const params: PromQLQueryParams = {
        body: {
          query: 'up',
          language: 'promql',
          maxResults: 100,
          timeout: 30,
          options: {
            queryType: 'instant',
            start: '2021-12-01T00:00:00Z',
            end: '2021-12-01T01:00:00Z',
            step: '15s',
          },
        },
        dataconnection: 'prom-conn',
      };

      await expect(prometheusManager.query(mockContext, mockRequest, params)).rejects.toThrow(
        'Query timeout'
      );
    });

    it('should throw error when no query executor is set', async () => {
      await expect(
        prometheusManager.query(mockContext, mockRequest, {} as PromQLQueryParams)
      ).rejects.toThrow('No query executor available');
    });
  });
});
