/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Boom from '@hapi/boom';
import { Type } from '@osd/config-schema';
import { IRouter, RequestHandlerContext } from '../../../../core/server';
import { httpServerMock, httpServiceMock } from '../../../../core/server/mocks';
import { IndexPatternsFetcher } from './fetcher';
import { registerRoutes } from './routes';

const mockGetFieldsForWildcard = jest.fn();
jest.mock('./fetcher', () => ({
  IndexPatternsFetcher: jest.fn().mockImplementation(() => ({
    getFieldsForWildcard: mockGetFieldsForWildcard,
  })),
}));

type PostRoute = Parameters<IRouter['post']>;

describe('POST /api/index_patterns/{id}/_refresh_fields', () => {
  const scriptedField = { name: 'script', type: 'number', scripted: true, script: 'doc.a' };
  const localCaller = jest.fn();
  const dataSourceCaller = jest.fn();
  const getDataSourceClient = jest.fn();

  const createContext = () => ({
    core: {
      opensearch: { legacy: { client: { callAsCurrentUser: localCaller } } },
      savedObjects: {
        client: { get: jest.fn(), update: jest.fn().mockResolvedValue({ version: 'v2' }) },
      },
    },
    dataSource: {
      opensearch: {
        legacy: { getClient: getDataSourceClient },
      },
    } as { opensearch: { legacy: { getClient: jest.Mock } } } | undefined,
  });

  let routeConfig: PostRoute[0];
  let handler: PostRoute[1];
  let mockContext: ReturnType<typeof createContext>;
  let mockResponse: ReturnType<typeof httpServerMock.createResponseFactory>;

  const callHandler = () =>
    handler(
      mockContext as unknown as RequestHandlerContext,
      httpServerMock.createOpenSearchDashboardsRequest({
        params: { id: 'id' },
        query: { meta_fields: ['_id'] },
      }),
      mockResponse
    );

  const mockSavedObject = (savedObject: { attributes?: object; references?: object[] }) =>
    mockContext.core.savedObjects.client.get.mockResolvedValue({
      id: 'id',
      version: 'v1',
      references: [],
      ...savedObject,
      attributes: { title: 'logs-*', timeFieldName: '@timestamp', ...savedObject.attributes },
    });

  const savedFieldsArg = () =>
    JSON.parse(mockContext.core.savedObjects.client.update.mock.calls[0][2].fields);

  beforeEach(() => {
    const router = httpServiceMock.createRouter();
    const http = httpServiceMock.createSetupContract();
    http.createRouter.mockReturnValue(router);
    registerRoutes(http);
    const route = router.post.mock.calls.find(
      ([config]) => config.path === '/api/index_patterns/{id}/_refresh_fields'
    );
    if (!route) {
      throw new Error('The _refresh_fields route was not registered');
    }
    [routeConfig, handler] = route;

    mockResponse = httpServerMock.createResponseFactory();
    getDataSourceClient.mockReset();
    getDataSourceClient.mockReturnValue({ callAPI: dataSourceCaller });
    mockContext = createContext();
    (IndexPatternsFetcher as jest.Mock).mockClear();
    mockGetFieldsForWildcard.mockReset();
    mockGetFieldsForWildcard.mockResolvedValue([{ name: 'new', type: 'string' }]);
  });

  it('does not accept a data source from the request', () => {
    const { query } = routeConfig.validate as { query: Type<unknown> };
    expect(() => query.validate({ data_source: 'other' })).toThrow();
  });

  it('fetches fields on the server, keeps scripted fields and saves them', async () => {
    mockSavedObject({
      attributes: {
        fields: JSON.stringify([{ name: 'old', type: 'string', scripted: false }, scriptedField]),
      },
    });

    await callHandler();

    const fields = [{ name: 'new', type: 'string' }, scriptedField];
    expect(IndexPatternsFetcher).toHaveBeenCalledWith(localCaller);
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
    expect(mockResponse.ok).toHaveBeenCalledWith({
      body: {
        fields,
        version: 'v2',
        attributes: { title: 'logs-*', timeFieldName: '@timestamp' },
      },
    });
  });

  it('keeps the popularity count of fields that are still discovered', async () => {
    mockGetFieldsForWildcard.mockResolvedValue([
      { name: 'kept', type: 'string' },
      { name: 'new', type: 'string' },
    ]);
    mockSavedObject({
      attributes: {
        fields: JSON.stringify([
          { name: 'kept', type: 'string', count: 3 },
          { name: 'gone', type: 'string', count: 5 },
          { ...scriptedField, count: 2 },
        ]),
      },
    });

    await callHandler();

    expect(savedFieldsArg()).toEqual([
      { name: 'kept', type: 'string', count: 3 },
      { name: 'new', type: 'string' },
      { ...scriptedField, count: 2 },
    ]);
  });

  it('fetches fields from the data source the saved object references', async () => {
    mockSavedObject({
      references: [{ id: 'ds-1', type: 'data-source', name: 'dataSource' }],
    });

    await callHandler();

    expect(getDataSourceClient).toHaveBeenCalledWith('ds-1');
    expect(IndexPatternsFetcher).toHaveBeenCalledWith(dataSourceCaller);
  });

  it('recognizes a legacy data source reference by its name', async () => {
    mockSavedObject({ references: [{ id: 'ds-1', type: 'OpenSearch', name: 'dataSource' }] });

    await callHandler();

    expect(getDataSourceClient).toHaveBeenCalledWith('ds-1');
  });

  it('rejects a pattern that references a data source when data sources are disabled', async () => {
    mockContext.dataSource = undefined;
    mockSavedObject({
      references: [{ id: 'ds-1', type: 'data-source', name: 'dataSource' }],
    });

    await callHandler();

    expect(mockResponse.badRequest).toHaveBeenCalled();
    expect(mockGetFieldsForWildcard).not.toHaveBeenCalled();
    expect(mockContext.core.savedObjects.client.update).not.toHaveBeenCalled();
  });

  it('reads a saved field list stored as an array', async () => {
    mockSavedObject({ attributes: { fields: [scriptedField] } });

    await callHandler();

    expect(savedFieldsArg()).toEqual([{ name: 'new', type: 'string' }, scriptedField]);
  });

  it('saves only discovered fields when the pattern has no saved fields', async () => {
    mockSavedObject({});

    await callHandler();

    expect(savedFieldsArg()).toEqual([{ name: 'new', type: 'string' }]);
  });

  it('returns the boom error status and payload', async () => {
    mockSavedObject({});
    const error = Boom.notFound('No indices match pattern "logs-*"');
    Object.assign(error.output.payload, { code: 'no_matching_indices' });
    mockGetFieldsForWildcard.mockRejectedValue(error);

    await callHandler();

    expect(mockContext.core.savedObjects.client.update).not.toHaveBeenCalled();
    expect(mockResponse.customError).toHaveBeenCalledWith({
      statusCode: 404,
      body: { message: error.output.payload.message, attributes: error.output.payload },
    });
  });
});
