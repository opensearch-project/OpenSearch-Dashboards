/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { setupServer } from '../../../../core/server/test_utils';
import { loggingSystemMock } from '../../../../core/server/mocks';
import { defineRoutes } from './index';
import { MLAgentRouterFactory } from './ml_routes/ml_agent_router';
import { MLAgentRouterRegistry } from './ml_routes/router_registry';

// Mock native fetch
global.fetch = jest.fn();

describe('Chat Proxy Routes', () => {
  let server: any;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockLogger: any;
  let mockCapabilitiesResolver: jest.Mock;

  const testSetup = async (
    agUiUrl?: string,
    getCapabilitiesResolver?: () => ((request: any) => Promise<any>) | undefined,
    mlCommonsAgentId?: string,
    observabilityAgentId?: string,
    maxFileUploadBytes?: number,
    maxFileAttachments?: number
  ) => {
    const { server: testServer, httpSetup } = await setupServer();
    const router = httpSetup.createRouter('');
    mockLogger = loggingSystemMock.create().get();

    defineRoutes(
      router,
      mockLogger,
      agUiUrl,
      getCapabilitiesResolver,
      mlCommonsAgentId,
      observabilityAgentId,
      maxFileUploadBytes,
      maxFileAttachments
    );

    // Mock dynamicConfigService required by server.start()
    const dynamicConfigService = {
      getClient: jest.fn(),
      getAsyncLocalStore: jest.fn(),
      createStoreFromRequest: jest.fn(),
    };
    await testServer.start({ dynamicConfigService });
    server = testServer;
    return httpSetup;
  };

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    // Mock capabilities resolver
    mockCapabilitiesResolver = jest.fn().mockResolvedValue({
      investigation: {
        agenticFeaturesEnabled: false, // Default to false
      },
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('POST /api/chat/proxy', () => {
    const validRequest = {
      threadId: 'thread-123',
      runId: 'run-456',
      messages: [{ role: 'user', content: 'Hello' }],
      tools: [],
      context: [],
      state: {},
      forwardedProps: {},
    };

    it('should successfully proxy request to AG-UI server with streaming response', async () => {
      // Mock a streaming response
      const mockChunks = [
        Buffer.from('data: {"type":"start"}\n'),
        Buffer.from('data: {"type":"message","content":"Hello!"}\n'),
        Buffer.from('data: {"type":"end"}\n'),
      ];

      let chunkIndex = 0;
      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (chunkIndex < mockChunks.length) {
            return { done: false, value: mockChunks[chunkIndex++] };
          }
          return { done: true, value: undefined };
        }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as any);

      const httpSetup = await testSetup('http://test-agui:3000');

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send(validRequest)
        .expect(200);

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith('http://test-agui:3000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(validRequest),
      });

      // Verify response headers for SSE
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['content-encoding']).toBe('identity');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers.connection).toBe('keep-alive');
    });

    it('should return 503 when AG-UI URL is not configured', async () => {
      const httpSetup = await testSetup(); // No agUiUrl provided

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send(validRequest)
        .expect(503);

      expect(response.body).toEqual({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'No AI agent available: ML Commons agent not enabled and AG-UI URL not configured',
      });

      // Verify fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle AG-UI server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const httpSetup = await testSetup('http://test-agui:3000');

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send(validRequest)
        .expect(500);

      expect(response.body.message).toContain('AG-UI server error');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network/fetch errors', async () => {
      const networkError = new Error('Network connection failed');
      mockFetch.mockRejectedValue(networkError);

      const httpSetup = await testSetup('http://test-agui:3000');

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send(validRequest)
        .expect(500);

      expect(response.body.message).toBe('Network connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('AI agent routing error')
      );
    });

    it('should validate request body schema', async () => {
      const httpSetup = await testSetup('http://test-agui:3000');

      // Missing required fields
      await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send({ invalid: 'data' })
        .expect(400);

      // Missing threadId
      await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send({ runId: 'run-123', messages: [] })
        .expect(400);

      // Missing runId
      await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send({ threadId: 'thread-123', messages: [] })
        .expect(400);

      // Verify fetch was never called due to validation failures
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle empty stream responses', async () => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as any);

      const httpSetup = await testSetup('http://test-agui:3000');

      await supertest(httpSetup.server.listener)
        .post('/api/chat/proxy')
        .send(validRequest)
        .expect(200);

      expect(mockReader.read).toHaveBeenCalled();
    });

    it('should handle stream read errors gracefully', async () => {
      const mockReader = {
        read: jest.fn().mockRejectedValue(new Error('Stream read error')),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as any);

      const httpSetup = await testSetup('http://test-agui:3000');

      // Stream errors during transmission will cause connection to close
      // This is expected behavior - we just verify the server doesn't crash
      try {
        await supertest(httpSetup.server.listener).post('/api/chat/proxy').send(validRequest);
      } catch (error) {
        // Socket hang up or ECONNRESET is expected when stream fails
        expect(error.message).toMatch(/socket hang up|ECONNRESET|aborted/i);
      }

      // Verify the stream was attempted to be read
      expect(mockReader.read).toHaveBeenCalled();
    });

    describe('Generic ML Integration', () => {
      it('should fallback to AG-UI when agenticFeaturesEnabled is true but ML context is not available', async () => {
        // Enable agentic features but no ML context available
        mockCapabilitiesResolver.mockResolvedValue({
          investigation: {
            agenticFeaturesEnabled: true,
          },
        });

        // Mock successful AG-UI response
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);

        const httpSetup = await testSetup(
          'http://test-agui:3000',
          () => mockCapabilitiesResolver,
          'test-agent-id'
        );

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(200);

        // Verify capabilities were checked
        expect(mockCapabilitiesResolver).toHaveBeenCalled();

        // Verify AG-UI was called as fallback
        expect(mockFetch).toHaveBeenCalledWith('http://test-agui:3000', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(validRequest),
        });
      });

      it('should fallback to AG-UI when agenticFeaturesEnabled is true but ML client is disabled', async () => {
        // Enable agentic features but disable ML client
        mockCapabilitiesResolver.mockResolvedValue({
          investigation: {
            agenticFeaturesEnabled: true,
          },
        });
        // ML client disabled via missing context ML client

        // Mock successful AG-UI response
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);

        const httpSetup = await testSetup(
          'http://test-agui:3000',
          () => mockCapabilitiesResolver,
          'test-agent-id'
        );

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(200);

        // Verify capabilities were checked
        expect(mockCapabilitiesResolver).toHaveBeenCalled();

        // Verify AG-UI was called as fallback
        expect(mockFetch).toHaveBeenCalledWith('http://test-agui:3000', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(validRequest),
        });
      });

      it('should fallback to AG-UI when agenticFeaturesEnabled is false', async () => {
        // Disable agentic features
        mockCapabilitiesResolver.mockResolvedValue({
          investigation: {
            agenticFeaturesEnabled: false,
          },
        });

        // Mock successful AG-UI response
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);

        const httpSetup = await testSetup(
          'http://test-agui:3000',
          () => mockCapabilitiesResolver,
          'test-agent-id'
        );

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(200);

        // Verify capabilities were checked
        expect(mockCapabilitiesResolver).toHaveBeenCalled();

        // Verify AG-UI was called
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should return 503 when ML Commons agent ID is not configured', async () => {
        // Enable agentic features
        mockCapabilitiesResolver.mockResolvedValue({
          investigation: {
            agenticFeaturesEnabled: true,
          },
        });

        const httpSetup = await testSetup(
          undefined, // No AG-UI URL
          () => mockCapabilitiesResolver,
          undefined // No ML Commons agent ID
        );

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(503);

        expect(response.body.message).toContain(
          'No AI agent available: ML Commons agent not enabled and AG-UI URL not configured'
        );

        // Verify AG-UI was not called since ML router handled the error
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should fallback to AG-UI when capabilities resolver is not available', async () => {
        // Mock successful AG-UI response
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);

        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined, // No capabilities resolver
          'test-agent-id'
        );

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(200);

        // Verify AG-UI was called as fallback
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('File MIME type validation', () => {
      const mockSuccessfulAgUiResponse = () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);
      };

      it('should reject binary attachments with disallowed MIME types', async () => {
        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithBadFile = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'application/x-executable',
                  data: 'AAAA',
                  filename: 'malicious.exe',
                },
              ],
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithBadFile)
          .expect(400);

        expect(response.body.message).toContain(
          "File type 'application/x-executable' is not allowed"
        );
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should allow binary attachments with permitted MIME types', async () => {
        mockSuccessfulAgUiResponse();

        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithGoodFile = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/csv',
                  data: 'bmFtZSxhZ2U=',
                  filename: 'data.csv',
                },
              ],
            },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithGoodFile)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should allow messages with non-binary content (plain text)', async () => {
        mockSuccessfulAgUiResponse();

        const httpSetup = await testSetup('http://test-agui:3000');

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('Base64 data validation', () => {
      const mockSuccessfulAgUiResponse = () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);
      };

      it('should reject binary attachments with invalid base64 characters', async () => {
        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithBadBase64 = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/plain',
                  data: '!!!not-base64!!!',
                  filename: 'bad.txt',
                },
              ],
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithBadBase64)
          .expect(400);

        expect(response.body.message).toContain('invalid base64 data');
        expect(response.body.message).toContain('bad.txt');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should reject base64 with incorrect padding length', async () => {
        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithBadPadding = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/plain',
                  // Valid chars but length not a multiple of 4
                  data: 'abc',
                  filename: 'padded.txt',
                },
              ],
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithBadPadding)
          .expect(400);

        expect(response.body.message).toContain('invalid base64 data');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should allow valid base64 data', async () => {
        mockSuccessfulAgUiResponse();

        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithValidBase64 = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/plain',
                  data: 'aGVsbG8=',
                  filename: 'good.txt',
                },
              ],
            },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithValidBase64)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should use fallback filename when filename is not provided', async () => {
        const httpSetup = await testSetup('http://test-agui:3000');

        const requestNoFilename = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/plain',
                  data: '$$invalid$$',
                },
              ],
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestNoFilename)
          .expect(400);

        expect(response.body.message).toContain('attachment');
        expect(response.body.message).toContain('invalid base64 data');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should reject empty base64 data', async () => {
        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithEmptyData = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/plain',
                  data: '',
                  filename: 'empty.txt',
                },
              ],
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithEmptyData)
          .expect(400);

        expect(response.body.message).toContain('invalid base64 data');
        expect(response.body.message).toContain('empty.txt');
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe('File size validation', () => {
      const mockSuccessfulAgUiResponse = () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);
      };

      it('should reject binary attachments exceeding maxFileUploadBytes', async () => {
        mockSuccessfulAgUiResponse();

        // maxFileUploadBytes=100; base64 decodes to 112 bytes (exceeds limit).
        // proxyMaxBytes=1400 so the request body passes the parser.
        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          100
        );

        const oversizedBase64 = Buffer.from('x'.repeat(112)).toString('base64');
        const requestWithOversizedFile = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/plain',
                  data: oversizedBase64,
                  filename: 'large.txt',
                },
              ],
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithOversizedFile)
          .expect(400);

        expect(response.body.message).toContain('exceeds the');
        expect(response.body.message).toContain('size limit');
        expect(response.body.message).toContain('large.txt');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should allow binary attachments within maxFileUploadBytes', async () => {
        mockSuccessfulAgUiResponse();

        // maxFileUploadBytes=20; "aGVsbG8=" decodes to "hello" (5 bytes)
        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          20
        );

        const requestWithValidFile = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/csv',
                  data: 'bmFtZSxhZ2U=',
                  filename: 'data.csv',
                },
              ],
            },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithValidFile)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should not validate file size when maxFileUploadBytes is undefined', async () => {
        mockSuccessfulAgUiResponse();

        // No maxFileUploadBytes - size check is skipped
        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithLargeFile = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/plain',
                  data: 'aGVsbG8gd29ybGQ=',
                  filename: 'large.txt',
                },
              ],
            },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithLargeFile)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('File attachment count limit', () => {
      // Use a large maxFileUploadBytes so the payload size limit (413) doesn't
      // trigger before our count validation (400) runs.
      const largeMaxBytes = 100 * 1024 * 1024; // 100MB

      it('should reject requests with more than 10 binary attachments', async () => {
        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          largeMaxBytes
        );

        const tooManyFiles = Array.from({ length: 11 }, (_, i) => ({
          type: 'binary',
          mimeType: 'text/plain',
          data: 'aGVsbG8=',
          filename: `file${i}.txt`,
        }));

        const requestWithTooManyFiles = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: tooManyFiles,
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithTooManyFiles)
          .expect(400);

        expect(response.body.message).toContain('Too many file attachments (11)');
        expect(response.body.message).toContain('Maximum allowed: 10');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should allow exactly 10 binary attachments', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);

        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          largeMaxBytes
        );

        const tenFiles = Array.from({ length: 10 }, (_, i) => ({
          type: 'binary',
          mimeType: 'text/plain',
          data: 'aGVsbG8=',
          filename: `file${i}.txt`,
        }));

        const requestWithTenFiles = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: tenFiles,
            },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithTenFiles)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should enforce custom maxFileAttachments when configured', async () => {
        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          largeMaxBytes,
          5
        );

        const sixFiles = Array.from({ length: 6 }, (_, i) => ({
          type: 'binary',
          mimeType: 'text/plain',
          data: 'aGVsbG8=',
          filename: `file${i}.txt`,
        }));

        const requestWithSixFiles = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: sixFiles,
            },
          ],
        };

        const response = await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithSixFiles)
          .expect(400);

        expect(response.body.message).toContain('Too many file attachments (6)');
        expect(response.body.message).toContain('Maximum allowed: 5');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should allow exactly maxFileAttachments when custom limit is set', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);

        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          largeMaxBytes,
          5
        );

        const fiveFiles = Array.from({ length: 5 }, (_, i) => ({
          type: 'binary',
          mimeType: 'text/plain',
          data: 'aGVsbG8=',
          filename: `file${i}.txt`,
        }));

        const requestWithFiveFiles = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              id: 'msg-1',
              content: fiveFiles,
            },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithFiveFiles)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should only count attachments in the newest user message', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);

        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          largeMaxBytes
        );

        const fiveFiles = Array.from({ length: 5 }, (_, i) => ({
          type: 'binary',
          mimeType: 'text/plain',
          data: 'aGVsbG8=',
          filename: `file${i}.txt`,
        }));

        // Two user messages with 5 files each — total 10 but newest has only 5
        const requestWithHistory = {
          ...validRequest,
          messages: [
            { role: 'user', id: 'msg-1', content: fiveFiles },
            { role: 'assistant', id: 'msg-2', content: 'I see your files.' },
            { role: 'user', id: 'msg-3', content: [...fiveFiles] },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithHistory)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('System Prompt Injection', () => {
      const mockSuccessfulAgUiResponse = () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);
      };

      it('should inject system prompt when queryAssistLanguage is PROMQL', async () => {
        mockSuccessfulAgUiResponse();

        const httpSetup = await testSetup('http://test-agui:3000');

        const requestWithPromQL = {
          ...validRequest,
          forwardedProps: { queryAssistLanguage: 'PROMQL' },
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithPromQL)
          .expect(200);

        // Verify fetch was called with injected system prompt
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const fetchCall = mockFetch.mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]!.body as string);

        // System prompt should be prepended
        expect(requestBody.messages).toHaveLength(2);
        expect(requestBody.messages[0].role).toBe('user');
        expect(requestBody.messages[0].content).toContain('You are a PromQL expert');
        expect(requestBody.messages[0].id).toMatch(/^system-/);
        // Original message should follow
        expect(requestBody.messages[1]).toEqual(validRequest.messages[0]);
      });

      it('should not inject system prompt when queryAssistLanguage is not provided', async () => {
        mockSuccessfulAgUiResponse();

        const httpSetup = await testSetup('http://test-agui:3000');

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(200);

        // Verify fetch was called with original messages (no injection)
        const fetchCall = mockFetch.mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]!.body as string);

        expect(requestBody.messages).toHaveLength(1);
        expect(requestBody.messages[0]).toEqual(validRequest.messages[0]);
      });
    });

    describe('maxFileUploadBytes configuration', () => {
      const mockSuccessfulAgUiResponse = () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        } as any);
      };

      it('should accept large payloads when maxFileUploadBytes is configured', async () => {
        mockSuccessfulAgUiResponse();

        // Configure with 1MB limit → maxBytes = ceil(1MB * 1.4) = 1468007
        const httpSetup = await testSetup(
          'http://test-agui:3000',
          undefined,
          undefined,
          undefined,
          1048576
        );

        // Create a payload under the limit (should succeed)
        const requestWithAttachment = {
          ...validRequest,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'binary',
                  mimeType: 'text/csv',
                  data: 'a'.repeat(100000), // ~100KB base64
                  filename: 'test.csv',
                },
              ],
            },
          ],
        };

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(requestWithAttachment)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should use default payload limit when maxFileUploadBytes is not configured', async () => {
        mockSuccessfulAgUiResponse();

        const httpSetup = await testSetup('http://test-agui:3000');

        await supertest(httpSetup.server.listener)
          .post('/api/chat/proxy')
          .send(validRequest)
          .expect(200);

        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('POST /api/chat/memory/sessions/search', () => {
    const validSearchRequest = {
      query: {
        match_all: {},
      },
      from: 0,
      size: 10,
      sort: [{ created_time: { order: 'desc' } }],
    };

    let mockMLRouter: any;
    let mockMLAgentRouterFactory: any;
    let mockMLAgentRouterRegistry: any;

    beforeEach(() => {
      // Mock ML router with proxyRequest method
      mockMLRouter = {
        proxyRequest: jest.fn(),
        getRouterName: jest.fn().mockReturnValue('GenericMLRouter'),
      };

      // Mock MLAgentRouterFactory static methods
      mockMLAgentRouterFactory = MLAgentRouterFactory;
      jest.spyOn(mockMLAgentRouterFactory, 'getRouter').mockReturnValue(mockMLRouter);

      // Mock MLAgentRouterRegistry.initialize
      mockMLAgentRouterRegistry = MLAgentRouterRegistry;
      jest.spyOn(mockMLAgentRouterRegistry, 'initialize').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully search memory sessions with valid request', async () => {
      const mockAgentDetail = {
        memory: {
          memory_container_id: 'container-123',
        },
      };

      const mockSearchResponse = {
        hits: {
          total: { value: 2 },
          hits: [
            {
              _id: 'session-1',
              _source: {
                session_id: 'session-1',
                created_time: '2024-01-01T00:00:00Z',
                messages: [],
              },
            },
            {
              _id: 'session-2',
              _source: {
                session_id: 'session-2',
                created_time: '2024-01-02T00:00:00Z',
                messages: [],
              },
            },
          ],
        },
      };

      // Mock agent detail call
      mockMLRouter.proxyRequest.mockResolvedValueOnce(mockAgentDetail);
      // Mock search call
      mockMLRouter.proxyRequest.mockResolvedValueOnce(mockSearchResponse);

      const httpSetup = await testSetup(undefined, () => mockCapabilitiesResolver, 'test-agent-id');

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/memory/sessions/search')
        .send(validSearchRequest)
        .expect(200);

      expect(response.body).toEqual(mockSearchResponse);

      // Verify agent detail was fetched
      expect(mockMLRouter.proxyRequest).toHaveBeenCalledWith({
        context: expect.any(Object),
        request: expect.any(Object),
        method: 'GET',
        path: '/_plugins/_ml/agents/test-agent-id',
        dataSourceId: undefined,
      });

      // Verify search was performed
      expect(mockMLRouter.proxyRequest).toHaveBeenCalledWith({
        context: expect.any(Object),
        request: expect.any(Object),
        method: 'POST',
        path: '/_plugins/_ml/memory_containers/container-123/memories/sessions/_search',
        body: validSearchRequest,
        dataSourceId: undefined,
      });
    });

    it('should return 503 when ML Commons agent ID is not configured', async () => {
      const httpSetup = await testSetup(
        undefined,
        () => mockCapabilitiesResolver,
        undefined // No ML Commons agent ID
      );

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/memory/sessions/search')
        .send(validSearchRequest)
        .expect(503);

      expect(response.body).toEqual({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'ML Commons agent ID not configured',
      });

      // Verify proxyRequest was not called
      expect(mockMLRouter.proxyRequest).not.toHaveBeenCalled();
    });

    it('should return 503 when ML router is not available', async () => {
      // Override the mock to return null (no router available)
      mockMLAgentRouterFactory.getRouter.mockReturnValue(null);

      const httpSetup = await testSetup(undefined, () => mockCapabilitiesResolver, 'test-agent-id');

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/memory/sessions/search')
        .send(validSearchRequest)
        .expect(503);

      expect(response.body).toEqual({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'ML router not available',
      });
    });

    it('should handle error when memory container ID is not found', async () => {
      const mockAgentDetailWithoutMemory = {
        name: 'test-agent',
        // No memory field
      };

      mockMLRouter.proxyRequest.mockResolvedValueOnce(mockAgentDetailWithoutMemory);

      const httpSetup = await testSetup(undefined, () => mockCapabilitiesResolver, 'test-agent-id');

      const response = await supertest(httpSetup.server.listener)
        .post('/api/chat/memory/sessions/search')
        .send(validSearchRequest)
        .expect(500);

      expect(response.body.message).toBe('Memory container ID not found in agent detail');

      // Verify agent detail was fetched but search was not performed
      expect(mockMLRouter.proxyRequest).toHaveBeenCalledTimes(1);
    });

    it('should support optional query parameters (from, size, sort)', async () => {
      const mockAgentDetail = {
        memory: {
          memory_container_id: 'container-456',
        },
      };

      const mockSearchResponse = {
        hits: {
          total: { value: 100 },
          hits: [],
        },
      };

      mockMLRouter.proxyRequest.mockResolvedValueOnce(mockAgentDetail);
      mockMLRouter.proxyRequest.mockResolvedValueOnce(mockSearchResponse);

      const httpSetup = await testSetup(undefined, () => mockCapabilitiesResolver, 'test-agent-id');

      // Test with minimal request (only query)
      const minimalRequest = {
        query: { match_all: {} },
      };

      await supertest(httpSetup.server.listener)
        .post('/api/chat/memory/sessions/search')
        .send(minimalRequest)
        .expect(200);

      // Verify search was called with only query parameter
      expect(mockMLRouter.proxyRequest).toHaveBeenLastCalledWith({
        context: expect.any(Object),
        request: expect.any(Object),
        method: 'POST',
        path: '/_plugins/_ml/memory_containers/container-456/memories/sessions/_search',
        body: {
          query: { match_all: {} },
        },
        dataSourceId: undefined,
      });
    });

    it('should support dataSourceId query parameter', async () => {
      const mockAgentDetail = {
        memory: {
          memory_container_id: 'container-789',
        },
      };

      const mockSearchResponse = {
        hits: {
          total: { value: 0 },
          hits: [],
        },
      };

      mockMLRouter.proxyRequest.mockResolvedValueOnce(mockAgentDetail);
      mockMLRouter.proxyRequest.mockResolvedValueOnce(mockSearchResponse);

      const httpSetup = await testSetup(undefined, () => mockCapabilitiesResolver, 'test-agent-id');

      await supertest(httpSetup.server.listener)
        .post('/api/chat/memory/sessions/search?dataSourceId=ds-123')
        .send(validSearchRequest)
        .expect(200);

      // Verify agent detail was fetched with dataSourceId
      expect(mockMLRouter.proxyRequest).toHaveBeenCalledWith({
        context: expect.any(Object),
        request: expect.any(Object),
        method: 'GET',
        path: '/_plugins/_ml/agents/test-agent-id',
        dataSourceId: 'ds-123',
      });

      // Verify search was performed with dataSourceId
      expect(mockMLRouter.proxyRequest).toHaveBeenCalledWith({
        context: expect.any(Object),
        request: expect.any(Object),
        method: 'POST',
        path: '/_plugins/_ml/memory_containers/container-789/memories/sessions/_search',
        body: validSearchRequest,
        dataSourceId: 'ds-123',
      });
    });
  });
});
