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
    getIdentityEntries?: jest.Mock;
    getIdentityEntriesByIds?: jest.Mock;
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

  it('registers the capabilities routes', async () => {
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

  it('should call the getIdentityEntries method of the source handler for identity/_entries', async () => {
    const routeHandler = router.get.mock.calls[0][1];
    const mockRequest = {
      query: { perPage: 10, page: 1, source: 'test', type: 'users' },
    };

    await routeHandler(
      context,
      mockRequest as OpenSearchDashboardsRequest<unknown, unknown, unknown, 'get'>,
      responseFactory
    );

    expect(mockHandler.getIdentityEntries).toHaveBeenCalledWith(
      { perPage: 10, page: 1, source: 'test', type: 'users' },
      expect.anything(),
      expect.anything()
    );
  });

  it('should call the getIdentityEntriesByIds method of the source handler for identity/_entries', async () => {
    const routeHandler = router.post.mock.calls[0][1];
    const mockRequest = {
      body: { ids: ['id1', 'id2'], source: 'test', type: 'users' },
    };
    await routeHandler(
      context,
      mockRequest as OpenSearchDashboardsRequest<unknown, unknown, unknown, 'post'>,
      responseFactory
    );

    expect(mockHandler.getIdentityEntriesByIds).toHaveBeenCalledWith(
      { ids: ['id1', 'id2'], source: 'test', type: 'users' },
      expect.anything(),
      expect.anything()
    );
  });
});
