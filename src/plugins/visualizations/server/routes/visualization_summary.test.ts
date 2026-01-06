/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { of } from 'rxjs';
import { registerVisualizationSummaryRoute } from './visualization_summary';

describe('registerVisualizationSummaryRoute', () => {
  let mockRouter: any;
  let mockConfig$: any;
  let mockContext: any;
  let mockRequest: any;
  let mockResponse: any;
  let routeHandler: any;

  beforeEach(() => {
    // Mock router
    mockRouter = {
      post: jest.fn(),
    };

    // Mock context
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

    // Mock request
    mockRequest = {
      body: {
        visualization: 'base64-encoded-image',
      },
      query: {},
    };

    // Mock response
    mockResponse = {
      ok: jest.fn((params) => params),
      badRequest: jest.fn((params) => params),
      notFound: jest.fn((params) => params),
      customError: jest.fn((params) => params),
    };

    // Register the route and capture the handler
    registerVisualizationSummaryRoute(mockRouter);
    routeHandler = mockRouter.post.mock.calls[0][1];
  });

  it('should register POST route at /api/visualizations/summary', () => {
    expect(mockRouter.post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/visualizations/summary',
      }),
      expect.any(Function)
    );
  });

  it('should retrieve agent ID from ML config API', async () => {
    const mockConfigResponse = {
      body: {
        configuration: {
          agent_id: 'agent-123',
        },
      },
    };

    mockContext.core.opensearch.client.asCurrentUser.transport.request
      .mockResolvedValueOnce(mockConfigResponse)
      .mockResolvedValueOnce({
        body: {
          inference_results: [
            {
              output: [
                {
                  result: JSON.stringify({
                    output: {
                      message: {
                        content: [{ text: 'Test summary' }],
                      },
                    },
                  }),
                },
              ],
            },
          ],
        },
      });

    await routeHandler(mockContext, mockRequest, mockResponse);

    expect(mockContext.core.opensearch.client.asCurrentUser.transport.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/_plugins/_ml/config/os_visualization_summary',
      })
    );
  });

  it('should return 404 if agent ID is not found in config', async () => {
    mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValueOnce({
      body: {
        configuration: {},
      },
    });

    await routeHandler(mockContext, mockRequest, mockResponse);

    expect(mockResponse.notFound).toHaveBeenCalledWith({
      body: {
        message: 'Agent not found.',
      },
    });
  });

  it('should call ML agent execute API with visualization', async () => {
    const mockConfigResponse = {
      body: {
        configuration: {
          agent_id: 'agent-123',
        },
      },
    };

    const mockPredictResponse = {
      body: {
        inference_results: [
          {
            output: [
              {
                result: JSON.stringify({
                  output: {
                    message: {
                      content: [{ text: 'Test summary' }],
                    },
                  },
                }),
              },
            ],
          },
        ],
      },
    };

    mockContext.core.opensearch.client.asCurrentUser.transport.request
      .mockResolvedValueOnce(mockConfigResponse)
      .mockResolvedValueOnce(mockPredictResponse);

    await routeHandler(mockContext, mockRequest, mockResponse);

    expect(mockContext.core.opensearch.client.asCurrentUser.transport.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/_plugins/_ml/agents/agent-123/_execute',
        body: {
          parameters: {
            image_base64: 'base64-encoded-image',
          },
        },
      })
    );
  });

  it('should return summary on successful prediction', async () => {
    const mockConfigResponse = {
      body: {
        configuration: {
          agent_id: 'agent-123',
        },
      },
    };

    const mockPredictResponse = {
      body: {
        inference_results: [
          {
            output: [
              {
                result: JSON.stringify({
                  output: {
                    message: {
                      content: [{ text: 'This is a test summary' }],
                    },
                  },
                }),
              },
            ],
          },
        ],
      },
    };

    mockContext.core.opensearch.client.asCurrentUser.transport.request
      .mockResolvedValueOnce(mockConfigResponse)
      .mockResolvedValueOnce(mockPredictResponse);

    await routeHandler(mockContext, mockRequest, mockResponse);

    expect(mockResponse.ok).toHaveBeenCalledWith({
      body: {
        summary: 'This is a test summary',
      },
    });
  });

  it('should handle config API errors', async () => {
    const error = new Error('Config API error');
    (error as any).statusCode = 500;

    mockContext.core.opensearch.client.asCurrentUser.transport.request.mockRejectedValueOnce(error);

    await routeHandler(mockContext, mockRequest, mockResponse);

    expect(mockResponse.customError).toHaveBeenCalledWith({
      statusCode: 500,
      body: {
        message: expect.stringContaining('Failed to retrieve ML config'),
      },
    });
  });

  it('should handle predict API errors', async () => {
    const mockConfigResponse = {
      body: {
        configuration: {
          agent_id: 'agent-123',
        },
      },
    };

    const error = new Error('Predict API error');
    (error as any).statusCode = 500;

    mockContext.core.opensearch.client.asCurrentUser.transport.request
      .mockResolvedValueOnce(mockConfigResponse)
      .mockRejectedValueOnce(error);

    await routeHandler(mockContext, mockRequest, mockResponse);

    expect(mockResponse.customError).toHaveBeenCalledWith({
      statusCode: 500,
      body: {
        message: expect.stringContaining('Failed to generate visualization summary'),
      },
    });
  });

  it('should support data source ID in query', async () => {
    const mockRequestWithDataSource = {
      ...mockRequest,
      query: {
        dataSourceId: 'ds-123',
      },
    };

    const mockContextWithDataSource = {
      ...mockContext,
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockResolvedValue({
            transport: {
              request: jest
                .fn()
                .mockResolvedValueOnce({
                  body: {
                    configuration: {
                      agent_id: 'agent-123',
                    },
                  },
                })
                .mockResolvedValueOnce({
                  body: {
                    inference_results: [
                      {
                        output: [
                          {
                            result: JSON.stringify({
                              output: {
                                message: {
                                  content: [{ text: 'Test summary' }],
                                },
                              },
                            }),
                          },
                        ],
                      },
                    ],
                  },
                }),
            },
          }),
        },
      },
    };

    await routeHandler(mockContextWithDataSource, mockRequestWithDataSource, mockResponse);

    expect(mockContextWithDataSource.dataSource.opensearch.getClient).toHaveBeenCalledWith(
      'ds-123'
    );
  });
});
