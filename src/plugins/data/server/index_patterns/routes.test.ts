/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Boom from '@hapi/boom';
import { httpServerMock, httpServiceMock } from '../../../../core/server/mocks';
import { registerRoutes } from './routes';

const mockGetFieldsForWildcard = jest.fn();
jest.mock('./fetcher', () => ({
  IndexPatternsFetcher: jest.fn().mockImplementation(() => ({
    getFieldsForWildcard: mockGetFieldsForWildcard,
  })),
}));

describe('POST /api/index_patterns/{id}/_refresh_fields', () => {
  let router: ReturnType<typeof httpServiceMock.createRouter>;
  let mockContext: any;
  let mockResponse: ReturnType<typeof httpServerMock.createResponseFactory>;
  let handler: any;

  const createRequest = () =>
    httpServerMock.createOpenSearchDashboardsRequest({
      params: { id: 'id' },
      query: { meta_fields: ['_id'] },
    });

  beforeEach(() => {
    router = httpServiceMock.createRouter();
    const http = httpServiceMock.createSetupContract();
    http.createRouter.mockReturnValue(router);
    registerRoutes(http);
    handler = router.post.mock.calls.find(
      ([config]) => config.path === '/api/index_patterns/{id}/_refresh_fields'
    )?.[1];

    mockResponse = httpServerMock.createResponseFactory();
    mockContext = {
      core: {
        opensearch: { legacy: { client: { callAsCurrentUser: jest.fn() } } },
        savedObjects: {
          client: {
            get: jest.fn().mockResolvedValue({
              version: 'v1',
              attributes: {
                title: 'logs-*',
                fields: JSON.stringify([
                  { name: 'old', type: 'string', scripted: false },
                  { name: 'script', type: 'number', scripted: true, script: 'doc.a' },
                ]),
              },
            }),
            update: jest.fn().mockResolvedValue({ version: 'v2' }),
          },
        },
      },
    };
    mockGetFieldsForWildcard.mockReset();
  });

  it('fetches fields on the server, keeps scripted fields and saves them', async () => {
    mockGetFieldsForWildcard.mockResolvedValue([{ name: 'new', type: 'string' }]);

    await handler(mockContext, createRequest(), mockResponse);

    const fields = [
      { name: 'new', type: 'string' },
      { name: 'script', type: 'number', scripted: true, script: 'doc.a' },
    ];
    expect(mockGetFieldsForWildcard).toHaveBeenCalledWith({
      pattern: 'logs-*',
      metaFields: ['_id'],
    });
    expect(mockContext.core.savedObjects.client.update).toHaveBeenCalledWith(
      'index-pattern',
      'id',
      { fields: JSON.stringify(fields) },
      { version: 'v1' }
    );
    expect(mockResponse.ok).toHaveBeenCalledWith({ body: { fields, version: 'v2' } });
  });

  it('returns the boom error status and payload', async () => {
    const error = Boom.notFound('No indices match pattern "logs-*"');
    (error.output.payload as any).code = 'no_matching_indices';
    mockGetFieldsForWildcard.mockRejectedValue(error);

    await handler(mockContext, createRequest(), mockResponse);

    expect(mockContext.core.savedObjects.client.update).not.toHaveBeenCalled();
    expect(mockResponse.customError).toHaveBeenCalledWith({
      statusCode: 404,
      body: { message: error.output.payload.message, attributes: error.output.payload },
    });
  });
});
