/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../../src/core/server';
import { httpServerMock, httpServiceMock } from '../../../../../src/core/server/mocks';
import { registerDataConnectionsRoute } from './data_connections_router';
import { DataConnectionType } from '../../../data_source/common/data_connections';

// Import the mapPrometheusProperties function for direct testing
// Since it's not exported, we'll test it through the route handlers
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  log: jest.fn(),
  get: jest.fn(),
};

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
      registerDataConnectionsRoute(router, true, mockLogger);
    });

    it('should create Prometheus data connection with saved object', async () => {
      const mockCreateDataSourceResponse = { success: true, name: 'test-prometheus' };

      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
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

      expect(mockContext.core.savedObjects.client.create).toHaveBeenCalledWith('data-connection', {
        connectionId: 'test-prometheus',
        type: DataConnectionType.Prometheus,
      });

      expect(mockResponse.ok).toHaveBeenCalledWith({ body: mockCreateDataSourceResponse });
    });

    it('should not create saved object for non-Prometheus connectors', async () => {
      const mockCreateDataSourceResponse = { success: true, name: 'test-s3' };

      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
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
        // A string error body is wrapped so callers always get an object with a
        // `message`, rather than sometimes a bare string and sometimes undefined.
        body: { message: 'Internal Server Error' },
      });
    });
  });

  describe('POST /dataconnections with dataSourceEnabled=false', () => {
    beforeEach(() => {
      registerDataConnectionsRoute(router, false, mockLogger);
    });

    it('should not create saved object for Prometheus when dataSourceEnabled is false', async () => {
      const mockCreateDataSourceResponse = { success: true, name: 'test-prometheus' };

      mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
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
      registerDataConnectionsRoute(router, true, mockLogger);
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
            // The route matches on connectionId exactly, so a fuzzy `find` hit that is
            // not the requested connection is skipped rather than deleted.
            attributes: { connectionId: 'test-prometheus' },
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
        perPage: 10000,
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
            // The route matches on connectionId exactly, so a fuzzy `find` hit that is
            // not the requested connection is skipped rather than deleted.
            attributes: { connectionId: 'test-prometheus' },
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
            // The route matches on connectionId exactly, so a fuzzy `find` hit that is
            // not the requested connection is skipped rather than deleted.
            attributes: { connectionId: 'test-prometheus' },
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

    describe('mapPrometheusProperties OAuth2 Integration', () => {
      beforeEach(() => {
        registerDataConnectionsRoute(router, true, mockLogger);
      });

      it('should map OAuth2 properties from prometheus.auth.* to prometheus.oauth2.*', async () => {
        const mockCreateDataSourceResponse = { success: true, name: 'test-oauth2-prometheus' };

        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          body: {
            name: 'test-oauth2-prometheus',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: {
              'prometheus.uri': 'http://localhost:9090',
              'prometheus.auth.type': 'oauth2',
              'prometheus.auth.client_id': 'test-client-id',
              'prometheus.auth.client_secret': 'test-client-secret',
              'prometheus.auth.token_url': 'https://auth.example.com/token',
              'prometheus.auth.scopes': 'read write',
              'prometheus.auth.audience': 'https://api.example.com',
              'prometheus.auth.grant_type': 'client_credentials',
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

        // Verify that the properties were mapped correctly
        expect(mockCallAsCurrentUser).toHaveBeenCalledWith('ppl.createDataSource', {
          body: {
            name: 'test-oauth2-prometheus',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: expect.objectContaining({
              'prometheus.uri': 'http://localhost:9090',
              'prometheus.auth.type': 'oauth2',
              'prometheus.oauth2.clientId': 'test-client-id',
              'prometheus.oauth2.clientSecret': 'test-client-secret',
              'prometheus.oauth2.tokenUrl': 'https://auth.example.com/token',
              'prometheus.oauth2.scopes': 'read write',
              'prometheus.oauth2.audience': 'https://api.example.com',
              'prometheus.oauth2.grantType': 'client_credentials',
              'prometheus.oauth2.enabled': 'true',
            }),
          },
        });

        expect(mockLogger.debug).toHaveBeenCalledWith('OAuth2 configuration mapped to properties');

        // authMethod is how the wizard names the choice and is not part of the connector
        // property set, so it must not reach the backend.
        const sentProperties = mockCallAsCurrentUser.mock.calls[0][1].body.properties;
        expect(sentProperties).not.toHaveProperty('authMethod');
      });

      it('should handle OAuth2 properties with authMethod instead of prometheus.auth.type', async () => {
        const mockCreateDataSourceResponse = { success: true, name: 'test-oauth2-authmethod' };

        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          body: {
            name: 'test-oauth2-authmethod',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: {
              'prometheus.uri': 'http://localhost:9090',
              authMethod: 'oauth2',
              'prometheus.auth.client_id': 'test-client-id',
              'prometheus.auth.client_secret': 'test-client-secret',
              'prometheus.auth.token_url': 'https://auth.example.com/token',
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
            name: 'test-oauth2-authmethod',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: expect.objectContaining({
              'prometheus.oauth2.clientId': 'test-client-id',
              'prometheus.oauth2.clientSecret': 'test-client-secret',
              'prometheus.oauth2.tokenUrl': 'https://auth.example.com/token',
              'prometheus.oauth2.enabled': 'true',
              'prometheus.auth.type': 'oauth2',
            }),
          },
        });
      });

      it('should handle partial OAuth2 configuration (missing optional fields)', async () => {
        const mockCreateDataSourceResponse = { success: true, name: 'test-oauth2-partial' };

        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          body: {
            name: 'test-oauth2-partial',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: {
              'prometheus.uri': 'http://localhost:9090',
              'prometheus.auth.type': 'oauth2',
              'prometheus.auth.client_id': 'test-client-id',
              'prometheus.auth.client_secret': 'test-client-secret',
              'prometheus.auth.token_url': 'https://auth.example.com/token',
              // Missing scopes, audience, grant_type
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
            name: 'test-oauth2-partial',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: expect.objectContaining({
              'prometheus.oauth2.clientId': 'test-client-id',
              'prometheus.oauth2.clientSecret': 'test-client-secret',
              'prometheus.oauth2.tokenUrl': 'https://auth.example.com/token',
              'prometheus.oauth2.enabled': 'true',
              'prometheus.auth.type': 'oauth2',
            }),
          },
        });

        // Should not have undefined values for missing optional fields
        const calledProperties = mockCallAsCurrentUser.mock.calls[0][1].body.properties;
        expect(calledProperties['prometheus.oauth2.scopes']).toBeUndefined();
        expect(calledProperties['prometheus.oauth2.audience']).toBeUndefined();
        expect(calledProperties['prometheus.oauth2.grantType']).toBeUndefined();
      });

      it('should not modify properties for non-OAuth2 Prometheus data sources', async () => {
        const mockCreateDataSourceResponse = { success: true, name: 'test-basic-auth-prometheus' };

        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          body: {
            name: 'test-basic-auth-prometheus',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: {
              'prometheus.uri': 'http://localhost:9090',
              'prometheus.auth.type': 'basicauth',
              'prometheus.auth.username': 'test-user',
              'prometheus.auth.password': 'test-password',
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

        // Properties should remain unchanged for non-OAuth2 auth
        expect(mockCallAsCurrentUser).toHaveBeenCalledWith('ppl.createDataSource', {
          body: {
            name: 'test-basic-auth-prometheus',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: {
              'prometheus.uri': 'http://localhost:9090',
              'prometheus.auth.type': 'basicauth',
              'prometheus.auth.username': 'test-user',
              'prometheus.auth.password': 'test-password',
            },
          },
        });

        // Should not have OAuth2 properties
        const calledProperties = mockCallAsCurrentUser.mock.calls[0][1].body.properties;
        expect(calledProperties['prometheus.oauth2.enabled']).toBeUndefined();
        expect(calledProperties['prometheus.oauth2.clientId']).toBeUndefined();
      });

      it('should not modify properties for non-Prometheus connectors', async () => {
        const mockCreateDataSourceResponse = { success: true, name: 'test-s3-connector' };

        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          body: {
            name: 'test-s3-connector',
            connector: 's3glue',
            allowedRoles: ['admin'],
            properties: {
              'glue.indexstore.opensearch.uri': 'https://opensearch.example.com',
              'glue.indexstore.opensearch.region': 'us-west-2',
              'prometheus.auth.type': 'oauth2', // This should be ignored for non-Prometheus
              'prometheus.auth.client_id': 'should-not-be-mapped',
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

        // Properties should remain unchanged for non-Prometheus connectors
        expect(mockCallAsCurrentUser).toHaveBeenCalledWith('ppl.createDataSource', {
          body: {
            name: 'test-s3-connector',
            connector: 's3glue',
            allowedRoles: ['admin'],
            properties: {
              'glue.indexstore.opensearch.uri': 'https://opensearch.example.com',
              'glue.indexstore.opensearch.region': 'us-west-2',
              'prometheus.auth.type': 'oauth2',
              'prometheus.auth.client_id': 'should-not-be-mapped',
            },
          },
        });

        // Should not have OAuth2 mapping
        const calledProperties = mockCallAsCurrentUser.mock.calls[0][1].body.properties;
        expect(calledProperties['prometheus.oauth2.enabled']).toBeUndefined();
        expect(calledProperties['prometheus.oauth2.clientId']).toBeUndefined();
      });

      it('should reject a Prometheus data source with null properties', async () => {
        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          body: {
            name: 'test-null-properties',
            connector: 'prometheus',
            allowedRoles: ['admin'],
            properties: null,
          },
        });

        const mockCallAsCurrentUser = jest.fn();
        mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
          {
            callAsCurrentUser: mockCallAsCurrentUser,
          }
        );
        mockContext.core.savedObjects.client.create.mockResolvedValue({});

        const postHandler = router.post.mock.calls[0][1];
        await postHandler(mockContext, mockRequest, mockResponse);

        // A Prometheus connection has nowhere to put its URI without properties, so the
        // mapping step rejects it up front instead of handing an unusable body to the
        // backend.
        expect(mockCallAsCurrentUser).not.toHaveBeenCalled();
        expect(mockResponse.custom).toHaveBeenCalledWith({
          statusCode: 400,
          body: { message: 'Properties object is required for Prometheus mapping' },
        });
      });
    });
  });

  describe('DELETE /dataconnections/:name with dataSourceEnabled=false', () => {
    beforeEach(() => {
      registerDataConnectionsRoute(router, false, mockLogger);
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
