/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, RequestHandlerContext } from 'src/core/server';
import { coreMock, httpServerMock } from '../../../../../../core/server/mocks';
import { updateWorkspaceState } from '../../../../../../core/server/utils';
import { flightsSpecProvider } from '../data_sets';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';
import { createUninstallRoute } from './uninstall';

const flightsSampleDataset = flightsSpecProvider();

const sampleDatasets: SampleDatasetSchema[] = [flightsSampleDataset];

describe('sample data uninstall route', () => {
  let mockCoreSetup: MockedKeys<CoreSetup>;
  // @ts-expect-error TS7034 TODO(ts-error): fixme
  let mockUsageTracker;
  // @ts-expect-error TS7034 TODO(ts-error): fixme
  let mockClient;
  // @ts-expect-error TS7034 TODO(ts-error): fixme
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
            // @ts-expect-error TS7005 TODO(ts-error): fixme
            client: { callAsCurrentUser: mockClient },
          },
        },
        // @ts-expect-error TS7005 TODO(ts-error): fixme
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

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    createUninstallRoute(mockCoreSetup.http.createRouter(), sampleDatasets, mockUsageTracker);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.delete.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(mockClient).toBeCalled();
    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(mockSOClient.delete).toBeCalled();
  });

  it('handler calls expected api with the given request with data source', async () => {
    const mockDataSourceId = 'dataSource';

    const mockContext = {
      dataSource: {
        opensearch: {
          legacy: {
            // @ts-expect-error TS7006 TODO(ts-error): fixme
            getClient: (id) => {
              return {
                // @ts-expect-error TS7005 TODO(ts-error): fixme
                callAPI: mockClient,
              };
            },
          },
        },
      },
      core: {
        // @ts-expect-error TS7005 TODO(ts-error): fixme
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

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    createUninstallRoute(mockCoreSetup.http.createRouter(), sampleDatasets, mockUsageTracker);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.delete.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(mockClient).toBeCalled();
    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(mockSOClient.delete).toBeCalled();
  });

  it('handler calls expected api with the given request with workspace', async () => {
    const mockWorkspaceId = 'workspace';
    const mockContext = {
      core: {
        opensearch: {
          legacy: {
            // @ts-expect-error TS7005 TODO(ts-error): fixme
            client: { callAsCurrentUser: mockClient },
          },
        },
        // @ts-expect-error TS7005 TODO(ts-error): fixme
        savedObjects: { client: mockSOClient },
      },
    };
    const mockBody = { id: 'flights' };
    const mockQuery = {};
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
      params: mockBody,
      query: mockQuery,
    });
    updateWorkspaceState(mockRequest, { requestWorkspaceId: mockWorkspaceId });
    const mockResponse = httpServerMock.createResponseFactory();

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    createUninstallRoute(mockCoreSetup.http.createRouter(), sampleDatasets, mockUsageTracker);

    const mockRouter = mockCoreSetup.http.createRouter.mock.results[0].value;
    const handler = mockRouter.delete.mock.calls[0][1];

    await handler((mockContext as unknown) as RequestHandlerContext, mockRequest, mockResponse);

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(mockClient).toBeCalled();
    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(mockSOClient.delete).toBeCalled();
  });
});
