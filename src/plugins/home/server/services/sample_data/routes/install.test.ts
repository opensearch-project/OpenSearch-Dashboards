/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, RequestHandlerContext } from 'src/core/server';
import { coreMock, httpServerMock } from '../../../../../../core/server/mocks';
import { flightsSpecProvider } from '../data_sets';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';
import { createInstallRoute } from './install';

const flightsSampleDataset = flightsSpecProvider();

const sampleDatasets: SampleDatasetSchema[] = [flightsSampleDataset];

describe('sample data install route', () => {
  let mockCoreSetup: MockedKeys<CoreSetup>;
  let mockLogger;
  let mockUsageTracker;

  beforeEach(() => {
    mockCoreSetup = coreMock.createSetup();
    mockLogger = {
      warn: jest.fn(),
    };

    mockUsageTracker = {
      addInstall: jest.fn(),
      addUninstall: jest.fn(),
    };
  });

  it('handler calls expected api with the given request', async () => {
    const mockClient = jest.fn().mockResolvedValue(true);

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: '12345',
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };
    const mockSOClient = { bulkCreate: jest.fn().mockResolvedValue(mockSOClientGetResponse) };

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
    const mockBody = { id: 'flights' };
    const mockQuery = {};
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      params: mockBody,
      query: mockQuery,
    });
    const mockResponse = httpServerMock.createResponseFactory();

    createInstallRoute(
      mockCoreSetup.http.createRouter(),
      sampleDatasets,
      mockLogger,
      mockUsageTracker
    );

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.post.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient.mock.calls[1][1].body.settings).toMatchObject({
      index: { number_of_shards: 1, auto_expand_replicas: '0-1' },
    });

    // expect(mockClient).toBeCalledTimes(2);
    expect(mockResponse.ok).toBeCalled();
    expect(mockResponse.ok.mock.calls[0][0]).toMatchObject({
      body: {
        opensearchIndicesCreated: { opensearch_dashboards_sample_data_flights: 13059 },
        opensearchDashboardsSavedObjectsLoaded: 20,
      },
    });
  });

  it('handler calls expected api with the given request with data source', async () => {
    const mockDataSourceId = 'dataSource';

    const mockClient = jest.fn().mockResolvedValue(true);

    const mockSOClientGetResponse = {
      saved_objects: [
        {
          type: 'dashboard',
          id: '12345',
          namespaces: ['default'],
          attributes: { title: 'dashboard' },
        },
      ],
    };
    const mockSOClient = {
      bulkCreate: jest.fn().mockResolvedValue(mockSOClientGetResponse),
      get: jest.fn().mockResolvedValue(mockSOClientGetResponse),
    };

    const mockContext = {
      dataSource: {
        opensearch: {
          legacy: {
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
    const mockBody = { id: 'flights' };
    const mockQuery = { data_source_id: mockDataSourceId };
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      params: mockBody,
      query: mockQuery,
    });
    const mockResponse = httpServerMock.createResponseFactory();

    createInstallRoute(
      mockCoreSetup.http.createRouter(),
      sampleDatasets,
      mockLogger,
      mockUsageTracker
    );

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.post.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient.mock.calls[1][1].body.settings).toMatchObject({
      index: { number_of_shards: 1 },
    });

    expect(mockResponse.ok).toBeCalled();
    expect(mockResponse.ok.mock.calls[0][0]).toMatchObject({
      body: {
        opensearchIndicesCreated: { opensearch_dashboards_sample_data_flights: 13059 },
        opensearchDashboardsSavedObjectsLoaded: 20,
      },
    });
  });
});
