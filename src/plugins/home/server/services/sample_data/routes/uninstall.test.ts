/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, RequestHandlerContext } from 'src/core/server';
import { coreMock, httpServerMock } from '../../../../../../core/server/mocks';
import { flightsSpecProvider } from '../data_sets';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';
import { createUninstallRoute } from './uninstall';

const flightsSampleDataset = flightsSpecProvider();

const sampleDatasets: SampleDatasetSchema[] = [flightsSampleDataset];

describe('sample data uninstall route', () => {
  let mockCoreSetup: MockedKeys<CoreSetup>;
  let mockUsageTracker;
  let mockClient;
  let mockSOClient;

  beforeEach(() => {
    mockCoreSetup = coreMock.createSetup();

    mockUsageTracker = {
      addInstall: jest.fn(),
      addUninstall: jest.fn(),
    };

    mockClient = jest.fn();
    mockSOClient = { delete: jest.fn().mockResolvedValue(true) };
  });

  it('handler calls expected api with the given request', async () => {
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

    createUninstallRoute(mockCoreSetup.http.createRouter(), sampleDatasets, mockUsageTracker);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.delete.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient).toBeCalled();
    expect(mockSOClient.delete).toBeCalled();
  });

  it('handler calls expected api with the given request with data source', async () => {
    const mockDataSourceId = 'dataSource';

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

    createUninstallRoute(mockCoreSetup.http.createRouter(), sampleDatasets, mockUsageTracker);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.delete.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    expect(mockClient).toBeCalled();
    expect(mockSOClient.delete).toBeCalled();
  });
});
