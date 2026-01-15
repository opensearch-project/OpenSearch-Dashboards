/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { PrometheusConnectionClient } from './prometheus_connection_client';

describe('PrometheusConnectionClient', () => {
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
    it('should return success status and data from response body', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['label1', 'label2'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const client = new PrometheusConnectionClient(mockContext, mockRequest);
      const result = await client.getResources({
        path: '/api/v1/labels',
        querystring: '',
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: '/api/v1/labels',
        querystring: '',
        method: 'GET',
      });
      expect(result).toEqual({
        status: 'success',
        data: ['label1', 'label2'],
        type: 'prometheus',
      });
    });

    it('should pass through error status from response body', async () => {
      const mockResponse = {
        body: {
          status: 'error',
          data: null,
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const client = new PrometheusConnectionClient(mockContext, mockRequest);
      const result = await client.getResources({
        path: '/api/v1/labels',
        querystring: '',
      });

      expect(result).toEqual({
        status: 'error',
        data: null,
        type: 'prometheus',
      });
    });

    it('should propagate errors from transport request', async () => {
      mockClient.transport.request.mockRejectedValue(new Error('Connection failed'));

      const client = new PrometheusConnectionClient(mockContext, mockRequest);

      await expect(
        client.getResources({
          path: '/api/v1/labels',
          querystring: '',
        })
      ).rejects.toThrow('Connection failed');
    });

    it('should include query parameters in request', async () => {
      const mockResponse = {
        body: {
          status: 'success',
          data: ['value1'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const client = new PrometheusConnectionClient(mockContext, mockRequest);
      await client.getResources({
        path: '/api/v1/label/job/values',
        querystring: 'start=1638316800&end=1638320400',
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: '/api/v1/label/job/values',
        querystring: 'start=1638316800&end=1638320400',
        method: 'GET',
      });
    });
  });
});
