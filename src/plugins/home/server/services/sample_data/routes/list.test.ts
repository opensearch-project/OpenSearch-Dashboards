/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, RequestHandlerContext } from 'src/core/server';
import { updateWorkspaceState } from '../../../../../../core/server/utils';
import { coreMock, httpServerMock } from '../../../../../../core/server/mocks';
import { createListRoute } from './list';
import { flightsSpecProvider, logsSpecProvider, ecommerceSpecProvider } from '../data_sets';
import { otelSpecProvider } from '../data_sets/otel';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';

const flightsSampleDataset = flightsSpecProvider();
const logsSampleDataset = logsSpecProvider();
const ecommerceSampleDataset = ecommerceSpecProvider();
const otelSampleDataset = otelSpecProvider();

const sampleDatasets: SampleDatasetSchema[] = [flightsSampleDataset];
const allSampleDatasets: SampleDatasetSchema[] = [
  flightsSampleDataset,
  logsSampleDataset,
  ecommerceSampleDataset,
  otelSampleDataset,
];

describe('sample data list route', () => {
  let mockCoreSetup: MockedKeys<CoreSetup>;

  beforeEach(() => {
    mockCoreSetup = coreMock.createSetup();
  });

  it('handler calls expected api with the given request', async () => {
    const mockClient = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ count: 1 });

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: '7adfa750-4c81-11e8-b3d7-01146121b73d',
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };
    const mockSOClient = { get: jest.fn().mockResolvedValue(mockSOClientGetResponse) };

    const mockContext = {
      core: {
        opensearch: {
          legacy: {
            client: { callAsCurrentUser: mockClient },
          },
        },
        savedObjects: { client: mockSOClient },
      },
    };
    const mockBody = {};
    const mockQuery = {};
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      body: mockBody,
      query: mockQuery,
    });
    const mockResponse = httpServerMock.createResponseFactory();

    createListRoute(mockCoreSetup.http.createRouter(), sampleDatasets);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.get.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient).toBeCalledTimes(2);
    expect(mockResponse.ok).toBeCalled();
    expect(mockSOClient.get.mock.calls[0][1]).toMatch('7adfa750-4c81-11e8-b3d7-01146121b73d');
  });

  it('handler calls expected api with the given request with data source', async () => {
    const mockDataSourceId = 'dataSource';
    const mockClient = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ count: 1 });

    // Mock data source response (for engine type check)
    const mockDataSourceResponse = {
      id: mockDataSourceId,
      type: 'data-source',
      attributes: {
        title: 'Data Source Test',
        dataSourceEngineType: 'OpenSearch',
      },
    };

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: `${mockDataSourceId}_7adfa750-4c81-11e8-b3d7-01146121b73d`,
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };
    const mockSOClient = {
      get: jest
        .fn()
        .mockResolvedValueOnce(mockDataSourceResponse)
        .mockResolvedValue(mockSOClientGetResponse),
    };

    const mockContext = {
      dataSource: {
        opensearch: {
          legacy: {
            // @ts-expect-error TS7006 TODO(ts-error): fixme
            getClient: (id) => {
              return {
                callAPI: mockClient,
              };
            },
          },
        },
      },
      core: {
        savedObjects: { client: mockSOClient },
      },
    };

    const mockBody = {};
    const mockQuery = { data_source_id: mockDataSourceId };
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      body: mockBody,
      query: mockQuery,
    });
    const mockResponse = httpServerMock.createResponseFactory();

    createListRoute(mockCoreSetup.http.createRouter(), sampleDatasets);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.get.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient).toBeCalledTimes(2);
    expect(mockResponse.ok).toBeCalled();
    // First call is for data source, second call is for dashboard
    expect(mockSOClient.get.mock.calls[0]).toEqual(['data-source', mockDataSourceId]);
    expect(mockSOClient.get.mock.calls[1][1]).toMatch(
      `${mockDataSourceId}_7adfa750-4c81-11e8-b3d7-01146121b73d`
    );
  });

  it('handler calls expected api with the given request with workspace', async () => {
    const mockWorkspaceId = 'workspace';
    const mockClient = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ count: 1 });

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: `${mockWorkspaceId}_7adfa750-4c81-11e8-b3d7-01146121b73d`,
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };
    const mockSOClient = { get: jest.fn().mockResolvedValue(mockSOClientGetResponse) };

    const mockContext = {
      core: {
        opensearch: {
          legacy: {
            client: { callAsCurrentUser: mockClient },
          },
        },
        savedObjects: { client: mockSOClient },
      },
    };

    const mockBody = {};
    const mockQuery = {};
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      body: mockBody,
      query: mockQuery,
    });
    updateWorkspaceState(mockRequest, { requestWorkspaceId: mockWorkspaceId });
    const mockResponse = httpServerMock.createResponseFactory();

    createListRoute(mockCoreSetup.http.createRouter(), sampleDatasets);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.get.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient).toBeCalledTimes(2);
    expect(mockResponse.ok).toBeCalled();
    expect(mockSOClient.get.mock.calls[0][1]).toMatch(
      `${mockWorkspaceId}_7adfa750-4c81-11e8-b3d7-01146121b73d`
    );
  });

  it('handler calls expected api with the given request with workspace and data source', async () => {
    const mockWorkspaceId = 'workspace';
    const mockDataSourceId = 'dataSource';
    const mockClient = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ count: 1 });

    // Mock data source response (for engine type check)
    const mockDataSourceResponse = {
      id: mockDataSourceId,
      type: 'data-source',
      attributes: {
        title: 'Data Source Test',
        dataSourceEngineType: 'OpenSearch',
      },
    };

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: `${mockWorkspaceId}_${mockDataSourceId}_7adfa750-4c81-11e8-b3d7-01146121b73d`,
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };
    const mockSOClient = {
      get: jest
        .fn()
        .mockResolvedValueOnce(mockDataSourceResponse)
        .mockResolvedValue(mockSOClientGetResponse),
    };

    const mockContext = {
      dataSource: {
        opensearch: {
          legacy: {
            // @ts-expect-error TS7006 TODO(ts-error): fixme
            getClient: (id) => {
              return {
                callAPI: mockClient,
              };
            },
          },
        },
      },
      core: {
        savedObjects: { client: mockSOClient },
      },
    };

    const mockBody = {};
    const mockQuery = { data_source_id: mockDataSourceId };
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      body: mockBody,
      query: mockQuery,
    });
    updateWorkspaceState(mockRequest, { requestWorkspaceId: mockWorkspaceId });
    const mockResponse = httpServerMock.createResponseFactory();

    createListRoute(mockCoreSetup.http.createRouter(), sampleDatasets);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.get.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient).toBeCalledTimes(2);
    expect(mockResponse.ok).toBeCalled();
    // First call is for data source, second call is for dashboard
    expect(mockSOClient.get.mock.calls[0]).toEqual(['data-source', mockDataSourceId]);
    expect(mockSOClient.get.mock.calls[1][1]).toMatch(
      `${mockWorkspaceId}_${mockDataSourceId}_7adfa750-4c81-11e8-b3d7-01146121b73d`
    );
  });

  it('filters sample datasets to only logs and otel for AnalyticEngine data source', async () => {
    const mockDataSourceId = 'analyticEngineDataSource';
    const mockClient = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ count: 1 });

    // Mock data source with AnalyticEngine engine type
    const mockDataSourceResponse = {
      id: mockDataSourceId,
      type: 'data-source',
      attributes: {
        title: 'Analytic Engine Test',
        dataSourceEngineType: 'AnalyticEngine',
      },
    };

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: `${mockDataSourceId}_90943e30-9a47-11e8-b64d-95841ca0b247`,
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };

    const mockSOClient = {
      get: jest
        .fn()
        .mockResolvedValueOnce(mockDataSourceResponse)
        .mockResolvedValue(mockSOClientGetResponse),
    };

    const mockContext = {
      dataSource: {
        opensearch: {
          legacy: {
            // @ts-expect-error TS7006 TODO(ts-error): fixme
            getClient: (id) => {
              return {
                callAPI: mockClient,
              };
            },
          },
        },
      },
      core: {
        savedObjects: { client: mockSOClient },
      },
    };

    const mockBody = {};
    const mockQuery = { data_source_id: mockDataSourceId };
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      body: mockBody,
      query: mockQuery,
    });
    const mockResponse = httpServerMock.createResponseFactory();

    createListRoute(mockCoreSetup.http.createRouter(), allSampleDatasets);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.get.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockSOClient.get).toHaveBeenCalledWith('data-source', mockDataSourceId);
    expect(mockResponse.ok).toBeCalled();

    // Verify that only logs and otel datasets are returned
    const responseBody = mockResponse.ok.mock.calls[0]?.[0]?.body as any[];
    expect(responseBody).toHaveLength(2);
    expect(responseBody.map((ds) => ds.id).sort()).toEqual(['logs', 'otel']);
  });

  it('returns all sample datasets for non-AnalyticEngine data source', async () => {
    const mockDataSourceId = 'openSearchDataSource';
    const mockClient = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ count: 1 });

    // Mock data source with OpenSearch engine type
    const mockDataSourceResponse = {
      id: mockDataSourceId,
      type: 'data-source',
      attributes: {
        title: 'OpenSearch Test',
        dataSourceEngineType: 'OpenSearch',
      },
    };

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: `${mockDataSourceId}_7adfa750-4c81-11e8-b3d7-01146121b73d`,
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };

    const mockSOClient = {
      get: jest
        .fn()
        .mockResolvedValueOnce(mockDataSourceResponse)
        .mockResolvedValue(mockSOClientGetResponse),
    };

    const mockContext = {
      dataSource: {
        opensearch: {
          legacy: {
            // @ts-expect-error TS7006 TODO(ts-error): fixme
            getClient: (id) => {
              return {
                callAPI: mockClient,
              };
            },
          },
        },
      },
      core: {
        savedObjects: { client: mockSOClient },
      },
    };

    const mockBody = {};
    const mockQuery = { data_source_id: mockDataSourceId };
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      body: mockBody,
      query: mockQuery,
    });
    const mockResponse = httpServerMock.createResponseFactory();

    createListRoute(mockCoreSetup.http.createRouter(), allSampleDatasets);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.get.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockSOClient.get).toHaveBeenCalledWith('data-source', mockDataSourceId);
    expect(mockResponse.ok).toBeCalled();

    // Verify that all datasets are returned
    const responseBody = mockResponse.ok.mock.calls[0]?.[0]?.body as any[];
    expect(responseBody).toHaveLength(4);
    expect(responseBody.map((ds) => ds.id).sort()).toEqual([
      'ecommerce',
      'flights',
      'logs',
      'otel',
    ]);
  });

  it('returns all sample datasets when no data_source_id is provided', async () => {
    const mockClient = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce({ count: 1 });

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: '7adfa750-4c81-11e8-b3d7-01146121b73d',
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };
    const mockSOClient = { get: jest.fn().mockResolvedValue(mockSOClientGetResponse) };

    const mockContext = {
      core: {
        opensearch: {
          legacy: {
            client: { callAsCurrentUser: mockClient },
          },
        },
        savedObjects: { client: mockSOClient },
      },
    };

    const mockBody = {};
    const mockQuery = {};
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      body: mockBody,
      query: mockQuery,
    });
    const mockResponse = httpServerMock.createResponseFactory();

    createListRoute(mockCoreSetup.http.createRouter(), allSampleDatasets);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.get.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockResponse.ok).toBeCalled();

    // Verify that all datasets are returned (no filtering without data source)
    const responseBody = mockResponse.ok.mock.calls[0]?.[0]?.body as any[];
    expect(responseBody).toHaveLength(4);
    expect(responseBody.map((ds) => ds.id).sort()).toEqual([
      'ecommerce',
      'flights',
      'logs',
      'otel',
    ]);
  });
});
