/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  Logger,
  OpenSearchClient,
} from '../../../../../core/server';
import { GenericMLRouter } from './generic_ml_router';

// Mock dependencies
const mockLogger = ({
  info: jest.fn(),
  error: jest.fn(),
} as unknown) as Logger;

const mockResponse = ({
  custom: jest.fn(),
  customError: jest.fn(),
} as unknown) as OpenSearchDashboardsResponseFactory;

const mockRequest = {
  body: { message: 'test message' },
} as OpenSearchDashboardsRequest;

describe('GenericMLRouter - ML Client Creation', () => {
  let router: GenericMLRouter;
  let mockContext: RequestHandlerContext & {
    dataSource?: {
      opensearch: {
        getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
      };
    };
  };
  let mockOpenSearchClient: OpenSearchClient;

  beforeEach(() => {
    jest.clearAllMocks();
    router = new GenericMLRouter();

    // Mock OpenSearch client
    mockOpenSearchClient = ({
      transport: {
        request: jest.fn(),
      },
    } as unknown) as OpenSearchClient;

    // Mock context
    mockContext = ({
      core: {
        opensearch: {
          client: {
            asCurrentUser: mockOpenSearchClient,
          },
        },
      },
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockResolvedValue(mockOpenSearchClient),
        },
      },
    } as unknown) as RequestHandlerContext & {
      dataSource?: {
        opensearch: {
          getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
        };
      };
    };
  });

  describe('Fallback ML Client Creation Logic', () => {
    it('should create fallback ML client when findMLClient returns undefined', async () => {
      // Mock findMLClient to return undefined (no existing ML client)
      const mockTransportResponse = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: { response: 'test response' },
      };

      (mockOpenSearchClient.transport.request as jest.Mock).mockResolvedValue(
        mockTransportResponse
      );

      await router.forward(mockContext, mockRequest, mockResponse, mockLogger, 'test-agent-id');

      // Verify fallback client was created and used
      expect(mockOpenSearchClient.transport.request).toHaveBeenCalledWith(
        {
          method: 'POST',
          path: '/_plugins/_ml/agents/test-agent-id/_execute/stream',
          body: JSON.stringify(mockRequest.body),
        },
        {
          asStream: true,
          requestTimeout: 300000,
          maxRetries: 0,
        }
      );
    });

    it('should use dataSource client when dataSourceId is provided', async () => {
      const mockDataSourceClient = ({
        transport: {
          request: jest.fn().mockResolvedValue({
            statusCode: 200,
            headers: {},
            body: { response: 'datasource response' },
          }),
        },
      } as unknown) as OpenSearchClient;

      (mockContext.dataSource!.opensearch.getClient as jest.Mock).mockResolvedValue(
        mockDataSourceClient
      );

      await router.forward(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id',
        'test-datasource-id'
      );

      // Verify dataSource.opensearch.getClient was called with correct dataSourceId
      expect(mockContext.dataSource!.opensearch.getClient).toHaveBeenCalledWith(
        'test-datasource-id'
      );

      // Verify dataSource client was used instead of current user client
      expect(mockDataSourceClient.transport.request).toHaveBeenCalled();
      expect(mockOpenSearchClient.transport.request).not.toHaveBeenCalled();
    });

    it('should use current user client when no dataSourceId provided', async () => {
      const mockTransportResponse = {
        statusCode: 200,
        headers: {},
        body: { response: 'current user response' },
      };

      (mockOpenSearchClient.transport.request as jest.Mock).mockResolvedValue(
        mockTransportResponse
      );

      await router.forward(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
        // No dataSourceId provided
      );

      // Verify current user client was used
      expect(mockOpenSearchClient.transport.request).toHaveBeenCalled();
      expect(mockContext.dataSource?.opensearch.getClient).not.toHaveBeenCalled();
    });

    it('should use current user client when dataSource context is not available', async () => {
      // Create context without dataSource
      const contextWithoutDataSource = {
        core: {
          opensearch: {
            client: {
              asCurrentUser: mockOpenSearchClient,
            },
          },
        },
      } as RequestHandlerContext;

      const mockTransportResponse = {
        statusCode: 200,
        headers: {},
        body: { response: 'current user response' },
      };

      (mockOpenSearchClient.transport.request as jest.Mock).mockResolvedValue(
        mockTransportResponse
      );

      await router.forward(
        contextWithoutDataSource,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id',
        'some-datasource-id' // dataSourceId provided but context.dataSource is undefined
      );

      // Verify current user client was used as fallback when dataSource context is unavailable
      expect(mockOpenSearchClient.transport.request).toHaveBeenCalled();
    });

    it('should return correct response format with default status code', async () => {
      const mockTransportResponse = {
        // No statusCode provided - should default to 200
        headers: { 'custom-header': 'value' },
        body: { data: 'test' },
      };

      (mockOpenSearchClient.transport.request as jest.Mock).mockResolvedValue(
        mockTransportResponse
      );

      await router.forward(mockContext, mockRequest, mockResponse, mockLogger, 'test-agent-id');

      expect(mockResponse.custom).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          body: { data: 'test' },
        })
      );
    });

    it('should return correct response format with default headers', async () => {
      const mockTransportResponse = {
        statusCode: 201,
        // No headers provided - should default to empty object
        body: { data: 'test' },
      };

      (mockOpenSearchClient.transport.request as jest.Mock).mockResolvedValue(
        mockTransportResponse
      );

      await router.forward(mockContext, mockRequest, mockResponse, mockLogger, 'test-agent-id');

      expect(mockResponse.custom).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          body: { data: 'test' },
        })
      );
    });

    it('should pass correct transport request options', async () => {
      const mockTransportResponse = {
        statusCode: 200,
        headers: {},
        body: { response: 'test' },
      };

      (mockOpenSearchClient.transport.request as jest.Mock).mockResolvedValue(
        mockTransportResponse
      );

      await router.forward(mockContext, mockRequest, mockResponse, mockLogger, 'test-agent-id');

      // Verify transport.request was called with correct options
      expect(mockOpenSearchClient.transport.request).toHaveBeenCalledWith(
        expect.any(Object), // request params
        {
          asStream: true,
          requestTimeout: 300000,
          maxRetries: 0,
        }
      );
    });

    it('should stringify request body correctly', async () => {
      const complexBody = {
        message: 'test',
        params: { key: 'value' },
        metadata: { source: 'unit-test' },
      };

      const requestWithComplexBody = {
        body: complexBody,
      } as OpenSearchDashboardsRequest;

      const mockTransportResponse = {
        statusCode: 200,
        headers: {},
        body: { response: 'test' },
      };

      (mockOpenSearchClient.transport.request as jest.Mock).mockResolvedValue(
        mockTransportResponse
      );

      await router.forward(
        mockContext,
        requestWithComplexBody,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      // Verify request body was properly stringified
      expect(mockOpenSearchClient.transport.request).toHaveBeenCalledWith(
        expect.objectContaining({
          body: JSON.stringify(complexBody),
        }),
        expect.any(Object)
      );
    });
  });
});
