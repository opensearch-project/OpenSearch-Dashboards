/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../../src/core/server';
import {
  httpServerMock,
  httpServiceMock,
  loggingSystemMock,
} from '../../../../../src/core/server/mocks';
import {
  logDataConnectionError,
  registerDataConnectionsRoute,
  registerNonMdsDataConnectionsRoute,
} from './data_connections_router';
import { DataConnectionType } from '../../../data_source/common/data_connections';

describe('data_connections_router', () => {
  let router: jest.Mocked<IRouter>;
  let mockContext: any;
  let mockRequest: any;
  let mockResponse: any;
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;

  beforeEach(() => {
    router = httpServiceMock.createRouter();
    logger = loggingSystemMock.createLogger();
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
      registerDataConnectionsRoute(router, true, logger);
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
        body: 'Internal Server Error',
      });
    });
  });

  describe('POST /dataconnections with dataSourceEnabled=false', () => {
    beforeEach(() => {
      registerDataConnectionsRoute(router, false, logger);
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
      registerDataConnectionsRoute(router, true, logger);
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
      registerDataConnectionsRoute(router, false, logger);
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

  describe('error logging', () => {
    // Shape of the StatusCodeError thrown by the legacy elasticsearch client when the security
    // plugin rejects `GET /_plugins/_query/_datasources` for a user without permission.
    const authorizationError = Object.assign(new Error('Authorization Exception'), {
      statusCode: 403,
      displayName: 'AuthorizationException',
      path: '/_plugins/_query/_datasources',
      body: {
        status: 403,
        error: {
          type: 'OpenSearchSecurityException',
          reason: 'There was internal problem at backend',
          details:
            'no permissions for [cluster:admin/opensearch/ql/datasources/read] and User [name=test-user, backend_roles=[read-only]]',
        },
      },
      response: '{"status":403}',
    });

    let consoleErrorSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    const mockCallAsCurrentUserRejection = (error: any) => {
      mockContext.opensearch_data_source_management.dataSourceManagementClient.asScoped.mockReturnValue(
        { callAsCurrentUser: jest.fn().mockRejectedValue(error) }
      );
    };

    describe('logDataConnectionError', () => {
      it.each([401, 403, 404])('logs %i errors at debug level', (statusCode) => {
        logDataConnectionError(logger, 'Issue in fetching data sources', {
          statusCode,
          message: 'expected failure',
        });

        expect(logger.debug).toHaveBeenCalledWith(
          `Issue in fetching data sources [${statusCode}]: expected failure`
        );
        expect(logger.error).not.toHaveBeenCalled();
      });

      it('logs unexpected errors at error level', () => {
        logDataConnectionError(logger, 'Issue in fetching data sources', {
          statusCode: 500,
          message: 'Internal Server Error',
        });

        expect(logger.error).toHaveBeenCalledWith(
          'Issue in fetching data sources [500]: Internal Server Error'
        );
        expect(logger.debug).not.toHaveBeenCalled();
      });

      it('falls back to body.statusCode', () => {
        logDataConnectionError(logger, 'Issue in fetching data sources', {
          body: { statusCode: 403 },
          message: 'Forbidden',
        });

        expect(logger.debug).toHaveBeenCalledWith(
          'Issue in fetching data sources [403]: Forbidden'
        );
        expect(logger.error).not.toHaveBeenCalled();
      });

      it('logs errors without a status code at error level', () => {
        logDataConnectionError(
          logger,
          'Issue in fetching data sources',
          new Error('socket hang up')
        );

        expect(logger.error).toHaveBeenCalledWith(
          'Issue in fetching data sources [unknown]: socket hang up'
        );
      });

      it('logs a single-line summary instead of the full error object', () => {
        logDataConnectionError(logger, 'Issue in fetching data sources', authorizationError);

        expect(logger.debug).toHaveBeenCalledTimes(1);
        const [logged, ...rest] = logger.debug.mock.calls[0];
        expect(typeof logged).toBe('string');
        expect(rest).toEqual([]);
        expect(logged).toBe('Issue in fetching data sources [403]: Authorization Exception');
        expect(logged).not.toContain('backend_roles');
      });
    });

    describe('GET /dataconnections/dataSourceMDSId=', () => {
      beforeEach(() => {
        registerDataConnectionsRoute(router, false, logger);
        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          params: { dataSourceMDSId: '' },
        });
      });

      it('returns 403 and logs at debug level without writing to the console', async () => {
        mockCallAsCurrentUserRejection(authorizationError);

        const getHandler = router.get.mock.calls[0][1];
        await getHandler(mockContext, mockRequest, mockResponse);

        expect(mockResponse.custom).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 403 })
        );
        expect(logger.debug).toHaveBeenCalledWith(
          'Issue in fetching data sources [403]: Authorization Exception'
        );
        expect(logger.error).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it('logs unexpected errors at error level', async () => {
        mockCallAsCurrentUserRejection({ statusCode: 500, message: 'Internal Server Error' });

        const getHandler = router.get.mock.calls[0][1];
        await getHandler(mockContext, mockRequest, mockResponse);

        expect(mockResponse.custom).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 500 })
        );
        expect(logger.error).toHaveBeenCalledWith(
          'Issue in fetching data sources [500]: Internal Server Error'
        );
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });

    describe('GET /dataconnections (non-MDS)', () => {
      beforeEach(() => {
        registerNonMdsDataConnectionsRoute(router, logger);
        mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      });

      it('returns 403 and logs at debug level without writing to the console', async () => {
        mockCallAsCurrentUserRejection(authorizationError);

        // Routes registered in order: GET /{name}, DELETE /{name}, POST edit, POST status, GET list
        const listHandler = router.get.mock.calls[1][1];
        await listHandler(mockContext, mockRequest, mockResponse);

        expect(mockResponse.custom).toHaveBeenCalledWith({
          statusCode: 403,
          body: authorizationError.response,
        });
        expect(logger.debug).toHaveBeenCalledWith(
          'Issue in fetching data sources [403]: Authorization Exception'
        );
        expect(logger.error).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });

    describe('DELETE /dataconnections/:name/dataSourceMDSId=', () => {
      beforeEach(() => {
        registerDataConnectionsRoute(router, true, logger);
      });

      it('logs a missing backend connection at debug level without writing to the console', async () => {
        mockRequest = httpServerMock.createOpenSearchDashboardsRequest({
          params: { name: 'test-prometheus', dataSourceMDSId: '' },
        });
        mockCallAsCurrentUserRejection({ statusCode: 404, message: 'Not found' });
        mockContext.core.savedObjects.client.find.mockResolvedValue({
          total: 0,
          saved_objects: [],
        });

        const deleteHandler = router.delete.mock.calls[0][1];
        await deleteHandler(mockContext, mockRequest, mockResponse);

        expect(logger.debug).toHaveBeenCalledWith(
          'Backend data connection not found, proceeding with saved object deletion'
        );
        expect(logger.error).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(mockResponse.ok).toHaveBeenCalled();
      });
    });
  });
});
