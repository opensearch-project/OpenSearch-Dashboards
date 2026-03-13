/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IdentitySourceService } from '../identity_source_service';
import { registerRoutes } from '.';
import { IRouter } from '../../http';
import { mockRouter } from '../../http/router/router.mock';
import { OpenSearchDashboardsRequest } from 'opensearch-dashboards/server';
import { coreMock, httpResourcesMock } from '../../mocks';
describe('Security router', () => {
  let router: jest.Mocked<IRouter>;
  let identitySourceService: jest.Mocked<IdentitySourceService>;
  let mockHandler: {
    getIdentityEntries: jest.Mock;
    getIdentityEntriesByIds: jest.Mock;
  };
  const context = { core: coreMock.createRequestHandlerContext() };
  const responseFactory = httpResourcesMock.createResponseFactory();

  beforeEach(async () => {
    router = mockRouter.create();
    mockHandler = {
      getIdentityEntries: jest.fn(),
      getIdentityEntriesByIds: jest.fn(),
    };

    identitySourceService = ({
      getIdentitySourceHandler: jest.fn().mockReturnValue(mockHandler),
    } as unknown) as jest.Mocked<IdentitySourceService>;
    registerRoutes({ router, identitySourceService });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('route registration', () => {
    it('should register GET and POST routes for identity/_entries', () => {
      expect(router.get).toHaveBeenCalledTimes(1);
      expect(router.get).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'identity/_entries',
        }),
        expect.any(Function)
      );
      expect(router.post).toHaveBeenCalledTimes(1);
      expect(router.post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'identity/_entries',
        }),
        expect.any(Function)
      );
    });
  });

  describe('GET identity/_entries', () => {
    it('should call getIdentityEntries with correct parameters', async () => {
      const mockResult = [{ id: 'user1', name: 'User 1' }];
      mockHandler.getIdentityEntries!.mockResolvedValue(mockResult);

      const routeHandler = router.get.mock.calls[0][1];
      const mockRequest = {
        query: { perPage: 10, page: 1, source: 'test', type: 'users', keyword: 'admin' },
      };

      await routeHandler(
        context,
        mockRequest as OpenSearchDashboardsRequest<unknown, unknown, unknown, 'get'>,
        responseFactory
      );

      expect(identitySourceService.getIdentitySourceHandler).toHaveBeenCalledWith('test');
      expect(mockHandler.getIdentityEntries).toHaveBeenCalledWith(
        { perPage: 10, page: 1, source: 'test', type: 'users', keyword: 'admin' },
        expect.anything(),
        expect.anything()
      );
      expect(responseFactory.ok).toHaveBeenCalledWith({
        body: mockResult,
      });
    });

    it('should throw error when getIdentityEntries method is not implemented', async () => {
      const handlerWithoutMethod = {};
      identitySourceService.getIdentitySourceHandler.mockReturnValue(handlerWithoutMethod);

      const routeHandler = router.get.mock.calls[0][1];
      const mockRequest = {
        query: { perPage: 10, page: 1, source: 'test', type: 'users' },
      };

      await expect(
        routeHandler(
          context,
          mockRequest as OpenSearchDashboardsRequest<unknown, unknown, unknown, 'get'>,
          responseFactory
        )
      ).rejects.toThrow('getIdentityEntries method has not been implemented');
    });
  });

  describe('POST identity/_entries', () => {
    it('should call getIdentityEntriesByIds with correct parameters', async () => {
      const mockResult = [
        { id: 'id1', name: 'User 1' },
        { id: 'id2', name: 'User 2' },
      ];
      mockHandler.getIdentityEntriesByIds!.mockResolvedValue(mockResult);

      const routeHandler = router.post.mock.calls[0][1];
      const mockRequest = {
        body: { ids: ['id1', 'id2'], source: 'test', type: 'users' },
      };

      await routeHandler(
        context,
        mockRequest as OpenSearchDashboardsRequest<unknown, unknown, unknown, 'post'>,
        responseFactory
      );

      expect(identitySourceService.getIdentitySourceHandler).toHaveBeenCalledWith('test');
      expect(mockHandler.getIdentityEntriesByIds).toHaveBeenCalledWith(
        { ids: ['id1', 'id2'], source: 'test', type: 'users' },
        expect.anything(),
        expect.anything()
      );
      expect(responseFactory.ok).toHaveBeenCalledWith({
        body: mockResult,
      });
    });

    it('should throw error when getIdentityEntriesByIds method is not implemented', async () => {
      const handlerWithoutMethod = {};
      identitySourceService.getIdentitySourceHandler.mockReturnValue(handlerWithoutMethod);

      const routeHandler = router.post.mock.calls[0][1];
      const mockRequest = {
        body: { ids: ['id1', 'id2'], source: 'test', type: 'users' },
      };

      await expect(
        routeHandler(
          context,
          mockRequest as OpenSearchDashboardsRequest<unknown, unknown, unknown, 'post'>,
          responseFactory
        )
      ).rejects.toThrow('getIdentityEntriesByIds method has not been implemented');
    });
  });
});
