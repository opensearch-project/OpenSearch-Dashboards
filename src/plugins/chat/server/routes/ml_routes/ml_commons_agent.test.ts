/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { forwardToMLCommonsAgent } from './ml_commons_agent';
import { loggingSystemMock } from '../../../../../core/server/mocks';

describe('forwardToMLCommonsAgent', () => {
  let mockContext: any;
  let mockRequest: any;
  let mockResponse: any;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = loggingSystemMock.create().get();

    mockContext = {
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: jest.fn(),
              },
            },
          },
        },
      },
    };

    mockRequest = {
      body: {
        threadId: 'thread-123',
        runId: 'run-456',
        messages: [{ role: 'user', content: 'Hello' }],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      },
    };

    mockResponse = {
      ok: jest.fn(),
      customError: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('successful requests', () => {
    it('should successfully forward request to ML Commons agent and return response', async () => {
      const mockMLResponse = {
        body: {
          id: 'response-123',
          message: 'ML Commons response',
          status: 'completed',
        },
      };

      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue(
        mockMLResponse
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      // Verify OpenSearch client was called correctly
      expect(
        mockContext.core.opensearch.client.asCurrentUser.transport.request
      ).toHaveBeenCalledWith({
        method: 'POST',
        path: '/_plugins/_ml/agents/test-agent-id/_execute',
        body: mockRequest.body,
      });

      // Verify successful response
      expect(mockResponse.ok).toHaveBeenCalledWith({
        headers: {
          'Content-Type': 'application/json',
        },
        body: mockMLResponse.body,
      });

      // Verify logging
      expect(mockLogger.debug).toHaveBeenCalledWith('Forwarding request to ML Commons agent', {
        agentId: 'test-agent-id',
      });

      expect(mockResponse.customError).not.toHaveBeenCalled();
    });

    it('should handle different request body structures', async () => {
      const differentRequestBody = {
        threadId: 'different-thread',
        runId: 'different-run',
        messages: [
          { role: 'user', content: 'What is the weather?' },
          { role: 'assistant', content: 'I can help with that.' },
        ],
        tools: [{ name: 'weather-tool' }],
        context: [{ type: 'location', value: 'Seattle' }],
        state: { temperature: 'celsius' },
        forwardedProps: { userId: 'user123' },
      };

      mockRequest.body = differentRequestBody;

      const mockMLResponse = { body: { result: 'success' } };
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue(
        mockMLResponse
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(
        mockContext.core.opensearch.client.asCurrentUser.transport.request
      ).toHaveBeenCalledWith({
        method: 'POST',
        path: '/_plugins/_ml/agents/test-agent-id/_execute',
        body: differentRequestBody,
      });
    });
  });

  describe('configuration handling', () => {
    it('should return 503 error when agent ID is not configured', async () => {
      await forwardToMLCommonsAgent(mockContext, mockRequest, mockResponse, mockLogger);

      expect(mockResponse.customError).toHaveBeenCalledWith({
        statusCode: 503,
        body: {
          message: 'ML Commons agent ID not configured',
        },
      });

      // Verify OpenSearch client was not called
      expect(
        mockContext.core.opensearch.client.asCurrentUser.transport.request
      ).not.toHaveBeenCalled();
      expect(mockResponse.ok).not.toHaveBeenCalled();
    });

    it('should use custom configured agent ID', async () => {
      const customAgentId = 'custom-production-agent-123';
      const mockMLResponse = {
        body: {
          id: 'response-123',
          message: 'Custom agent response',
          status: 'completed',
        },
      };

      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue(
        mockMLResponse
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        customAgentId
      );

      // Verify OpenSearch client was called with custom agent ID
      expect(
        mockContext.core.opensearch.client.asCurrentUser.transport.request
      ).toHaveBeenCalledWith({
        method: 'POST',
        path: `/_plugins/_ml/agents/${customAgentId}/_execute`,
        body: mockRequest.body,
      });

      // Verify logging includes custom agent ID
      expect(mockLogger.debug).toHaveBeenCalledWith('Forwarding request to ML Commons agent', {
        agentId: customAgentId,
      });

      // Verify successful response
      expect(mockResponse.ok).toHaveBeenCalledWith({
        headers: {
          'Content-Type': 'application/json',
        },
        body: mockMLResponse.body,
      });
    });
  });

  describe('error handling', () => {
    it('should handle 404 agent not found error', async () => {
      const notFoundError = new Error('404 Not Found - Agent not found');
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockRejectedValue(
        notFoundError
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(mockResponse.customError).toHaveBeenCalledWith({
        statusCode: 404,
        body: {
          message: 'ML Commons agent "test-agent-id" not found',
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error forwarding to ML Commons agent')
      );

      expect(mockResponse.ok).not.toHaveBeenCalled();
    });

    it('should handle general ML Commons errors', async () => {
      const generalError = new Error('Internal server error from ML Commons');
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockRejectedValue(
        generalError
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(mockResponse.customError).toHaveBeenCalledWith({
        statusCode: 500,
        body: {
          message: 'ML Commons agent error: Internal server error from ML Commons',
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error forwarding to ML Commons agent')
      );

      expect(mockResponse.ok).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      const nonErrorException = 'String error instead of Error object';
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockRejectedValue(
        nonErrorException
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(mockResponse.customError).toHaveBeenCalledWith({
        statusCode: 500,
        body: {
          message: 'ML Commons agent error: Unknown error',
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error forwarding to ML Commons agent')
      );
    });

    it('should handle different 404 error message formats', async () => {
      const variations = [
        'Response Error: 404',
        'StatusCodeError: 404 - Not Found',
        'ML Commons agent 404 response',
        'Error: Request failed with status 404',
      ];

      for (const errorMessage of variations) {
        jest.clearAllMocks();
        const error = new Error(errorMessage);
        mockContext.core.opensearch.client.asCurrentUser.transport.request.mockRejectedValue(error);

        await forwardToMLCommonsAgent(
          mockContext,
          mockRequest,
          mockResponse,
          mockLogger,
          'test-agent-id'
        );

        expect(mockResponse.customError).toHaveBeenCalledWith({
          statusCode: 404,
          body: {
            message: 'ML Commons agent "test-agent-id" not found',
          },
        });
      }
    });
  });

  describe('logging behavior', () => {
    it('should log request initiation with agent ID', async () => {
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue({
        body: {},
      });

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(mockLogger.debug).toHaveBeenCalledWith('Forwarding request to ML Commons agent', {
        agentId: 'test-agent-id',
      });
    });

    it('should log errors with full error details', async () => {
      const testError = new Error('Test error message');
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockRejectedValue(
        testError
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error forwarding to ML Commons agent: ${testError}`
      );
    });
  });

  describe('response format', () => {
    it('should return proper JSON response headers', async () => {
      const mockMLResponse = { body: { test: 'data' } };
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue(
        mockMLResponse
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(mockResponse.ok).toHaveBeenCalledWith({
        headers: {
          'Content-Type': 'application/json',
        },
        body: mockMLResponse.body,
      });
    });

    it('should forward the exact ML Commons response body', async () => {
      const complexResponseBody = {
        threadId: 'thread-123',
        runId: 'run-456',
        response: {
          content: 'AI generated response',
          metadata: {
            model: 'gpt-3.5-turbo',
            tokens: 150,
          },
        },
        status: 'completed',
        timestamp: '2023-10-01T12:00:00Z',
      };

      const mockMLResponse = {
        body: complexResponseBody,
      };

      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue(
        mockMLResponse
      );

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(mockResponse.ok).toHaveBeenCalledWith({
        headers: {
          'Content-Type': 'application/json',
        },
        body: complexResponseBody,
      });
    });
  });

  describe('agent configuration', () => {
    it('should use the configured agent ID', async () => {
      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue({
        body: {},
      });

      await forwardToMLCommonsAgent(
        mockContext,
        mockRequest,
        mockResponse,
        mockLogger,
        'test-agent-id'
      );

      expect(
        mockContext.core.opensearch.client.asCurrentUser.transport.request
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/_plugins/_ml/agents/test-agent-id/_execute',
        })
      );
    });
  });
});
