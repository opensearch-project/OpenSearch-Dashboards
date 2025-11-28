/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../../src/core/server';
import { httpServerMock, coreMock, httpServiceMock } from '../../../../../src/core/server/mocks';
import { registerDataConnectionsRoute } from './data_connections_router';
import { DataConnectionType } from '../../../data_source/common/data_connections';

describe('data_connections_router', () => {
  let router: jest.Mocked<IRouter>;
  let mockContext: any;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    router = httpServiceMock.createRouter();
    mockContext = {
      core: {
        savedObjects: {
          client: {
            create: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
      },
      dataSource: {
        opensearch: {
          legacy: {
            getClient: jest.fn().mockReturnValue({
              callAPI: jest.fn(),
            }),
          },
        },
      },
      opensearch_data_source_management: {
        dataSourceManagementClient: {
          asScoped: jest.fn().mockReturnValue({
            callAsCurrentUser: jest.fn(),
          }),
        },
      },
    };
    mockResponse = httpServerMock.createResponseFactory();
  });

  describe('POST /dataconnections', () => {
    beforeEach(() => {
      registerDataConnectionsRoute(router, true);
    });

    it('should create Prometheus data connection with saved object when dataSourceMDSId is provided', async () => {
      const mockCreateDataSourceResponse = { success: true, name: 'test-prometheus' };
      const mockSavedObjectResponse = {
        id: 'saved-object-id',
        type: 'data-connection',
        attributes: {},
        references: [],
      };

      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        query: { dataSourceMDSId: 'test-datasource-id' },
        body: {
          name: 'test-prometheus',
          connector: 'prometheus',
          allowedRoles: ['admin'],
          properties: {
            'prometheus.uri': 'http://localhost:9090',
          },
        },
      });

      const mockCallAPI = jest.fn().mockResolvedValue(mockCreateDataSourceResponse);
      mockContext.dataSource.opensearch.legacy.getClient.mockReturnValue({
        callAPI: mockCallAPI,
      });
      mockContext.core.savedObjects.client.create.mockResolvedValue(mockSavedObjectResponse);

      const postHandler = router.post.mock.calls[0][1];
      await postHandler(mockContext, mockRequest, mockResponse);

      expect(mockCallAPI).toHaveBeenCalledWith('ppl.createDataSource', {
        body: {
          name: 'test-prometheus',
          connector: 'prometheus',
          allowedRoles: ['admin'],
          properties: {
            'prometheus.uri': 'http://localhost:9090',
          },
        },
      });

      expect(mockContext.core.savedObjects.client.create).toHaveBeenCalledWith(
        'data-connection',
        {
          connectionId: 'test-prometheus',
          type: DataConnectionType.Prometheus,
          meta: JSON.stringify({
            properties: { 'prometheus.uri': 'http://localhost:9090' },
          }),
        },
        {
          references: [{ id: 'test-datasource-id', type: 'data-source', name: 'dataSource' }],
        }
      );

      expect(mockResponse.ok).toHaveBeenCalledWith({ body: mockCreateDataSourceResponse });
    });

    it('should create Prometheus data connection with saved object without dataSourceMDSId', async () => {
      const mockCreateDataSourceResponse = { success: true, name: 'test-prometheus' };

      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        query: {},
        body: {
          name: 'test-prometheus',
          connector: 'prometheus',
          allowedRoles: ['admin'],
          properties: {
            'prometheus.uri': 'http://localhost:9090',
          },
        },
      });

      const mockCallAsCurrentUser = jest.fn().mockResolvedValue(mockCreateDataSourceResponse);
      mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
        {
          callAsCurrentUser: mockCallAsCurrentUser,
        }
      );
      mockContext.core.savedObjects.client.create.mockResolvedValue({});

      const postHandler = router.post.mock.calls[0][1];
      await postHandler(mockContext, mockRequest, mockResponse);

      expect(mockCallAsCurrentUser).toHaveBeenCalledWith('ppl.createDataSource', {
        body: {
          name: 'test-prometheus',
          connector: 'prometheus',
          allowedRoles: ['admin'],
          properties: {
            'prometheus.uri': 'http://localhost:9090',
          },
        },
      });

      expect(mockContext.core.savedObjects.client.create).toHaveBeenCalledWith(
        'data-connection',
        {
          connectionId: 'test-prometheus',
          type: DataConnectionType.Prometheus,
          meta: JSON.stringify({
            properties: { 'prometheus.uri': 'http://localhost:9090' },
          }),
        },
        {
          references: [],
        }
      );
    });

    it('should not create saved object for non-Prometheus connectors', async () => {
      const mockCreateDataSourceResponse = { success: true, name: 'test-s3' };

      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        query: {},
        body: {
          name: 'test-s3',
          connector: 's3glue',
          allowedRoles: ['admin'],
          properties: {},
        },
      });

      const mockCallAsCurrentUser = jest.fn().mockResolvedValue(mockCreateDataSourceResponse);
      mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
        {
          callAsCurrentUser: mockCallAsCurrentUser,
        }
      );

      const postHandler = router.post.mock.calls[0][1];
      await postHandler(mockContext, mockRequest, mockResponse);

      expect(mockContext.core.savedObjects.client.create).not.toHaveBeenCalled();
      expect(mockResponse.ok).toHaveBeenCalledWith({ body: mockCreateDataSourceResponse });
    });

    it('should handle errors when creating data connection', async () => {
      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        query: {},
        body: {
          name: 'test-prometheus',
          connector: 'prometheus',
          allowedRoles: ['admin'],
          properties: {},
        },
      });

      const mockError = { statusCode: 500, response: 'Internal Server Error' };
      const mockCallAsCurrentUser = jest.fn().mockRejectedValue(mockError);
      mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
        {
          callAsCurrentUser: mockCallAsCurrentUser,
        }
      );

      const postHandler = router.post.mock.calls[0][1];
      await postHandler(mockContext, mockRequest, mockResponse);

      expect(mockResponse.custom).toHaveBeenCalledWith({
        statusCode: 500,
        body: 'Internal Server Error',
      });
    });
  });

  describe('POST /dataconnections with dataSourceEnabled=false', () => {
    beforeEach(() => {
      registerDataConnectionsRoute(router, false);
    });

    it('should not create saved object for Prometheus when dataSourceEnabled is false', async () => {
      const mockCreateDataSourceResponse = { success: true, name: 'test-prometheus' };

      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        query: {},
        body: {
          name: 'test-prometheus',
          connector: 'prometheus',
          allowedRoles: ['admin'],
          properties: {
            'prometheus.uri': 'http://localhost:9090',
          },
        },
      });

      const mockCallAsCurrentUser = jest.fn().mockResolvedValue(mockCreateDataSourceResponse);
      mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
        {
          callAsCurrentUser: mockCallAsCurrentUser,
        }
      );

      const postHandler = router.post.mock.calls[0][1];
      await postHandler(mockContext, mockRequest, mockResponse);

      expect(mockCallAsCurrentUser).toHaveBeenCalledWith('ppl.createDataSource', {
        body: {
          name: 'test-prometheus',
          connector: 'prometheus',
          allowedRoles: ['admin'],
          properties: {
            'prometheus.uri': 'http://localhost:9090',
          },
        },
      });

      // Should not create saved object when dataSourceEnabled is false
      expect(mockContext.core.savedObjects.client.create).not.toHaveBeenCalled();
      expect(mockResponse.ok).toHaveBeenCalledWith({ body: mockCreateDataSourceResponse });
    });
  });

  describe('DELETE /dataconnections/:name/dataSourceMDSId=:dataSourceMDSId', () => {
    beforeEach(() => {
      registerDataConnectionsRoute(router, true);
    });

    it('should delete data connection from backend and saved object', async () => {
      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        params: { name: 'test-prometheus', dataSourceMDSId: 'test-datasource-id' },
      });

      const mockCallAPI = jest.fn().mockResolvedValue({ success: true });
      mockContext.dataSource.opensearch.legacy.getClient.mockReturnValue({
        callAPI: mockCallAPI,
      });

      mockContext.core.savedObjects.client.find.mockResolvedValue({
        total: 1,
        saved_objects: [
          {
            id: 'saved-object-id',
            type: 'data-connection',
            attributes: {},
            references: [],
            score: 0,
          },
        ],
      });

      mockContext.core.savedObjects.client.delete.mockResolvedValue({});

      const deleteHandler = router.delete.mock.calls[0][1];
      await deleteHandler(mockContext, mockRequest, mockResponse);

      expect(mockCallAPI).toHaveBeenCalledWith('ppl.deleteDataConnection', {
        dataconnection: 'test-prometheus',
      });

      expect(mockContext.core.savedObjects.client.find).toHaveBeenCalledWith({
        type: 'data-connection',
        search: 'test-prometheus',
        searchFields: ['connectionId'],
        hasReference: { id: 'test-datasource-id', type: 'data-source' },
      });

      expect(mockContext.core.savedObjects.client.delete).toHaveBeenCalledWith(
        'data-connection',
        'saved-object-id'
      );

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: { success: true, deleted: 'test-prometheus' },
      });
    });

    it('should handle case when backend deletion fails but saved object exists', async () => {
      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        params: { name: 'test-prometheus', dataSourceMDSId: '' },
      });

      const mockError = { statusCode: 404, body: { message: 'Not found' } };
      const mockCallAsCurrentUser = jest.fn().mockRejectedValue(mockError);
      mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
        {
          callAsCurrentUser: mockCallAsCurrentUser,
        }
      );

      mockContext.core.savedObjects.client.find.mockResolvedValue({
        total: 1,
        saved_objects: [
          {
            id: 'saved-object-id',
            type: 'data-connection',
            attributes: {},
            references: [],
            score: 0,
          },
        ],
      });

      mockContext.core.savedObjects.client.delete.mockResolvedValue({});

      const deleteHandler = router.delete.mock.calls[0][1];
      await deleteHandler(mockContext, mockRequest, mockResponse);

      expect(mockContext.core.savedObjects.client.delete).toHaveBeenCalledWith(
        'data-connection',
        'saved-object-id'
      );

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: { success: true, deleted: 'test-prometheus' },
      });
    });

    it('should handle case when no saved object exists', async () => {
      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        params: { name: 'test-prometheus', dataSourceMDSId: 'test-datasource-id' },
      });

      const mockCallAPI = jest.fn().mockResolvedValue({ success: true });
      mockContext.dataSource.opensearch.legacy.getClient.mockReturnValue({
        callAPI: mockCallAPI,
      });

      mockContext.core.savedObjects.client.find.mockResolvedValue({
        total: 0,
        saved_objects: [],
      });

      const deleteHandler = router.delete.mock.calls[0][1];
      await deleteHandler(mockContext, mockRequest, mockResponse);

      expect(mockContext.core.savedObjects.client.delete).not.toHaveBeenCalled();

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: { success: true, deleted: 'test-prometheus' },
      });
    });

    it('should return error when saved object deletion fails', async () => {
      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        params: { name: 'test-prometheus', dataSourceMDSId: 'test-datasource-id' },
      });

      const mockCallAPI = jest.fn().mockResolvedValue({ success: true });
      mockContext.dataSource.opensearch.legacy.getClient.mockReturnValue({
        callAPI: mockCallAPI,
      });

      mockContext.core.savedObjects.client.find.mockResolvedValue({
        total: 1,
        saved_objects: [
          {
            id: 'saved-object-id',
            type: 'data-connection',
            attributes: {},
            references: [],
            score: 0,
          },
        ],
      });

      const deleteError = { statusCode: 500, message: 'Failed to delete saved object' };
      mockContext.core.savedObjects.client.delete.mockRejectedValue(deleteError);

      const deleteHandler = router.delete.mock.calls[0][1];
      await deleteHandler(mockContext, mockRequest, mockResponse);

      expect(mockResponse.custom).toHaveBeenCalledWith({
        statusCode: 500,
        body: {
          error: 'Failed to delete saved object',
          message: 'Failed to delete saved object',
        },
      });
    });
  });

  describe('DELETE /dataconnections/:name with dataSourceEnabled=false', () => {
    beforeEach(() => {
      registerDataConnectionsRoute(router, false);
    });

    it('should delete data connection but not attempt to delete saved object when dataSourceEnabled is false', async () => {
      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
        params: { name: 'test-prometheus', dataSourceMDSId: '' },
      });

      const mockDeleteResponse = { success: true };
      const mockCallAsCurrentUser = jest.fn().mockResolvedValue(mockDeleteResponse);
      mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
        {
          callAsCurrentUser: mockCallAsCurrentUser,
        }
      );

      const deleteHandler = router.delete.mock.calls[0][1];
      await deleteHandler(mockContext, mockRequest, mockResponse);

      expect(mockCallAsCurrentUser).toHaveBeenCalledWith('ppl.deleteDataConnection', {
        dataconnection: 'test-prometheus',
      });

      // Should not attempt to find or delete saved object when dataSourceEnabled is false
      expect(mockContext.core.savedObjects.client.find).not.toHaveBeenCalled();
      expect(mockContext.core.savedObjects.client.delete).not.toHaveBeenCalled();

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: mockDeleteResponse,
      });
    });
  });
});
