/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OpenSearchClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { SqlConnectionClient } from './sql_connection_client';

describe('SqlConnectionClient', () => {
  let mockContext: RequestHandlerContext;
  let mockRequest: OpenSearchDashboardsRequest;
  let mockClient: jest.Mocked<OpenSearchClient>;
  let sqlConnectionClient: SqlConnectionClient;

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

    sqlConnectionClient = new SqlConnectionClient(mockContext, mockRequest);
  });

  describe('getResources', () => {
    it('should return success response with data on successful request', async () => {
      const mockResponse = {
        body: {
          data: [{ name: 'table1' }, { name: 'table2' }],
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await sqlConnectionClient.getResources({
        path: '/api/sql/tables',
        querystring: '',
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: '/api/sql/tables',
        querystring: '',
        method: 'GET',
      });
      expect(result).toEqual({
        status: 'success',
        data: [{ name: 'table1' }, { name: 'table2' }],
        type: 'sql',
      });
    });

    it('should return failed response on error', async () => {
      mockClient.transport.request.mockRejectedValue(new Error('Connection failed'));

      const result = await sqlConnectionClient.getResources({
        path: '/api/sql/tables',
        querystring: '',
      });

      expect(result).toEqual({
        status: 'failed',
        data: [],
        type: 'sql',
      });
    });

    it('should pass querystring to the request', async () => {
      const mockResponse = {
        body: {
          data: { schema: [{ name: 'col1', type: 'string' }] },
        },
      };
      mockClient.transport.request.mockResolvedValue(mockResponse);

      await sqlConnectionClient.getResources({
        path: '/api/sql/describe',
        querystring: 'table=test_table',
      });

      expect(mockClient.transport.request).toHaveBeenCalledWith({
        path: '/api/sql/describe',
        querystring: 'table=test_table',
        method: 'GET',
      });
    });
  });
});
