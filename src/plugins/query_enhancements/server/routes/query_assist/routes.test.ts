/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { setupServer } from '../../../../../core/server/test_utils';
import { loggingSystemMock } from '../../../../../core/server/mocks';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../../core/server/opensearch/client/mocks';
import { registerQueryAssistRoutes } from './routes';
import { API } from '../../../common';
import { getAgentIdByConfig, requestAgentByConfig } from './agents';
import { getUnselectedTimeFields, parseTimeRangeXML } from './ppl/time_parser_utils';
import { HttpService } from 'opensearch-dashboards/server/http';

// Mock the dependencies
jest.mock('./agents');
jest.mock('./ppl/time_parser_utils');

const mockRequestAgentByConfig = requestAgentByConfig as jest.MockedFunction<
  typeof requestAgentByConfig
>;
const mockGetUnselectedTimeFields = getUnselectedTimeFields as jest.MockedFunction<
  typeof getUnselectedTimeFields
>;
const mockGetAgentIdByConfig = getAgentIdByConfig as jest.MockedFunction<typeof getAgentIdByConfig>;
const mockParseTimeRangeXML = parseTimeRangeXML as jest.MockedFunction<typeof parseTimeRangeXML>;

describe('Query Assist Routes', () => {
  let testServer: HttpService;
  let opensearchClient: ReturnType<typeof opensearchClientMock.createInternalClient>;

  const testSetup = async () => {
    const { server, httpSetup, handlerContext } = await setupServer();
    const router = httpSetup.createRouter('');

    opensearchClient = opensearchClientMock.createInternalClient();

    // Override the handler context to include our custom contexts
    const mockContext = {
      ...handlerContext,
      core: {
        opensearch: {
          client: {
            asCurrentUser: opensearchClient,
          },
        },
      },
      query_assist: {
        dataSourceEnabled: true,
        logger: loggingSystemMock.create().get(),
        configPromise: Promise.resolve({
          enabled: true,
          queryAssist: {
            supportedLanguages: [
              {
                language: 'PPL',
                agentConfig: 'ppl_agent',
                timeRangeParserAgentConfig: 'time_range_parser',
              },
              {
                language: 'SQL',
                agentConfig: 'sql_agent',
                timeRangeParserAgentConfig: 'time_range_parser',
              },
            ],
          },
        }),
      },
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockResolvedValue(opensearchClient),
          legacy: {
            getClient: jest.fn(),
          },
        },
      },
    };

    // Mock the router to inject our custom context
    const originalPost = router.post;
    const originalGet = router.get;

    router.post = jest.fn((config: any, handler: any) => {
      return originalPost.call(
        router,
        config,
        async (context: any, request: any, response: any) => {
          return handler(mockContext, request, response);
        }
      );
    }) as any;

    router.get = jest.fn((config: any, handler: any) => {
      return originalGet.call(router, config, async (context: any, request: any, response: any) => {
        return handler(mockContext, request, response);
      });
    }) as any;

    registerQueryAssistRoutes(router);
    const dynamicConfigService = {
      getClient: jest.fn(),
      getAsyncLocalStore: jest.fn(),
      createStoreFromRequest: jest.fn(),
    };
    await server.start({ dynamicConfigService });
    testServer = server;
    return httpSetup;
  };

  afterEach(async () => {
    if (testServer) {
      await testServer.stop();
    }
    jest.clearAllMocks();
  });

  describe('GET /api/query_assist/languages', () => {
    it('should return configured languages successfully', async () => {
      // Mock successful agent ID retrieval
      mockGetAgentIdByConfig.mockResolvedValue('agent-id-1');

      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .get(API.QUERY_ASSIST.LANGUAGES)
        .expect(200);

      expect(result.body).toEqual({
        configuredLanguages: ['PPL', 'SQL'],
      });
    });

    it('should handle agent configuration errors gracefully', async () => {
      // Mock agent configuration failure
      mockGetAgentIdByConfig.mockRejectedValue(new Error('Agent not found'));

      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .get(API.QUERY_ASSIST.LANGUAGES)
        .expect(200);

      expect(result.body).toEqual({
        configuredLanguages: [],
      });
    });
  });

  describe('POST /api/query_assist/generate', () => {
    const mockQueryResponse = {
      body: {
        inference_results: [
          {
            output: [
              {
                name: 'response',
                result:
                  '{"ppl":"source=opensearch_dashboards_sample_data_logs| where bytes < 500"}',
              },
            ],
          },
        ],
      },
    } as any;

    const mockTimeRangeResponse = {
      body: {
        inference_results: [
          {
            output: [
              {
                name: 'time_range',
                result: '<start>2024-01-01 00:00:00</start><end>2024-01-02 00:00:00</end>',
              },
            ],
          },
        ],
      },
    } as any;

    beforeEach(() => {
      // Default mock for successful query generation
      mockRequestAgentByConfig.mockResolvedValue(mockQueryResponse);
      mockGetUnselectedTimeFields.mockResolvedValue(['timestamp', 'created_at']);
    });

    it('should generate query successfully without time range', async () => {
      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me all documents',
          language: 'PPL',
        })
        .expect(200);

      expect(result.body).toEqual({
        query: 'source=opensearch_dashboards_sample_data_logs| where bytes < 500',
        timeRange: undefined,
      });

      expect(mockRequestAgentByConfig).toHaveBeenCalledWith({
        context: expect.any(Object),
        configName: 'ppl_agent',
        body: {
          parameters: {
            index: 'test_index',
            question: 'Show me all documents',
          },
        },
        dataSourceId: undefined,
      });
    });

    it('should generate query with time range when parameters are provided', async () => {
      mockParseTimeRangeXML.mockReturnValue({
        start: '2024-01-01 00:00:00',
        end: '2024-01-02 00:00:00',
      });

      // Mock time range parser response
      mockRequestAgentByConfig
        .mockResolvedValueOnce(mockQueryResponse) // First call for query generation
        .mockResolvedValueOnce(mockTimeRangeResponse); // Second call for time range parsing

      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me documents from yesterday',
          language: 'PPL',
          currentTime: '2024-01-02T12:00:00Z',
          timeField: 'timestamp',
        })
        .expect(200);

      expect(result.body).toEqual({
        query: 'source=opensearch_dashboards_sample_data_logs| where bytes < 500',
        timeRange: {
          from: '2024-01-01 00:00:00',
          to: '2024-01-02 00:00:00',
        },
      });

      // Verify both agent calls were made
      expect(mockRequestAgentByConfig).toHaveBeenCalledTimes(2);
      expect(mockGetUnselectedTimeFields).toHaveBeenCalledWith({
        indexName: 'test_index',
        selectedTimeField: 'timestamp',
        client: expect.any(Object),
        logger: expect.any(Object),
      });
    });

    it('should handle unsupported language', async () => {
      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me all documents',
          language: 'UNSUPPORTED',
        })
        .expect(400);

      expect(result.body.message).toBe('Unsupported language');
    });

    it('should handle query generation failure', async () => {
      mockRequestAgentByConfig.mockRejectedValue(new Error('Agent execution failed'));

      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me all documents',
          language: 'PPL',
        })
        .expect(500);

      expect(result.body.message).toBe('Agent execution failed');
    });

    it('should handle time range parser failure gracefully', async () => {
      mockRequestAgentByConfig
        .mockResolvedValueOnce(mockQueryResponse) // Query generation succeeds
        .mockRejectedValueOnce(new Error('Time parser failed')); // Time range parsing fails

      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me documents from yesterday',
          language: 'PPL',
          currentTime: '2024-01-02T12:00:00Z',
          timeField: 'timestamp',
        })
        .expect(200);

      expect(result.body).toEqual({
        query: 'source=opensearch_dashboards_sample_data_logs| where bytes < 500',
        timeRange: undefined,
      });
    });

    it('should handle getUnselectedTimeFields failure gracefully', async () => {
      mockGetUnselectedTimeFields.mockRejectedValue(new Error('Failed to get time fields'));

      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me documents from yesterday',
          language: 'PPL',
          currentTime: '2024-01-02T12:00:00Z',
          timeField: 'timestamp',
        })
        .expect(200);

      expect(result.body).toEqual({
        query: 'source=opensearch_dashboards_sample_data_logs| where bytes < 500',
        timeRange: undefined,
      });
    });

    it('should handle invalid time range XML parsing', async () => {
      mockParseTimeRangeXML.mockReturnValue(null);

      const invalidTimeRangeResponse = {
        body: {
          inference_results: [
            {
              output: [
                {
                  result: '<start>invalid</start><end>invalid</end>',
                },
              ],
            },
          ],
        },
      } as any;

      mockRequestAgentByConfig
        .mockResolvedValueOnce(mockQueryResponse)
        .mockResolvedValueOnce(invalidTimeRangeResponse);

      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me documents from yesterday',
          language: 'PPL',
          currentTime: '2024-01-02T12:00:00Z',
          timeField: 'timestamp',
        })
        .expect(200);

      expect(result.body).toEqual({
        query: 'source=opensearch_dashboards_sample_data_logs| where bytes < 500',
        timeRange: undefined,
      });
    });

    it('should work with data source enabled', async () => {
      const httpSetup = await testSetup();
      const result = await supertest(httpSetup.server.listener)
        .post(API.QUERY_ASSIST.GENERATE)
        .send({
          index: 'test_index',
          question: 'Show me all documents',
          language: 'PPL',
          dataSourceId: 'test-datasource',
        })
        .expect(200);

      expect(result.body).toEqual({
        query: 'source=opensearch_dashboards_sample_data_logs| where bytes < 500',
        timeRange: undefined,
      });
    });
  });
});
