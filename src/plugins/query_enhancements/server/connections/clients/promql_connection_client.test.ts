/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OpenSearchClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { PromQLConnectionClient } from './promql_connection_client';

describe('PromQLConnectionClient', () => {
  let mockContext: RequestHandlerContext;
  let mockRequest: OpenSearchDashboardsRequest;
  let mockClient: jest.Mocked<OpenSearchClient>;
  let promqlConnectionClient: PromQLConnectionClient;

  beforeEach(() => {
    mockClient = ({
      transport: {
        request: jest.fn(),
      },
    } as unknown) as jest.Mocked<OpenSearchClient>;

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

    promqlConnectionClient = new PromQLConnectionClient(mockContext, mockRequest);
  });

  describe('getResources', () => {
    it('should return success response with data on successful request', async () => {
      const mockResponse = {
        body: {
          data: ['label1', 'label2', 'label3'],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await promqlConnectionClient.getResources({
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
        data: ['label1', 'label2', 'label3'],
        type: 'promql',
      });
    });

    it('should return failed response on error', async () => {
      mockClient.transport.request.mockRejectedValue(new Error('Connection failed'));

      const result = await promqlConnectionClient.getResources({
        path: '/api/v1/labels',
        querystring: '',
      });

      expect(result).toEqual({
        status: 'failed',
        data: [],
        type: 'promql',
      });
    });

    it('should pass querystring to the request', async () => {
      const mockResponse = {
        body: {
          data: { metric: [{ type: 'counter', help: 'help text', unit: '' }] },
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      await promqlConnectionClient.getResources({
        path: '/api/v1/metadata',
        querystring: 'metric=up',
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: '/api/v1/metadata',
        querystring: 'metric=up',
        method: 'GET',
      });
    });
  });
});
