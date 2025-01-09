/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IdentitySourceService } from '../identity_source_service';
import { registerRoutes } from '.';
import { IRouter } from '../../http';
import { mockRouter } from '../../http/router/router.mock';

describe('Security router', () => {
  let router: IRouter;
  let identitySourceService: jest.Mocked<IdentitySourceService>;
  let mockHandler: {
    getUsers?: jest.Mock;
    getRoles?: jest.Mock;
  };

  beforeEach(async () => {
    router = mockRouter.create();
    mockHandler = {
      getUsers: jest.fn(),
      getRoles: jest.fn(),
    };

    identitySourceService = ({
      getSourceHandler: jest.fn().mockResolvedValue(mockHandler),
    } as unknown) as jest.Mocked<IdentitySourceService>;

    registerRoutes({ router, identitySourceService });
  });

  it('registers the capabilities routes', async () => {
    expect(router.post).toHaveBeenCalledTimes(2);
    expect(router.post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'identity/_users',
      }),
      expect.any(Function)
    );
    expect(router.post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'identity/_roles',
      }),
      expect.any(Function)
    );
  });

  it('should call the getUsers method of the source handler for identity/_users', async () => {
    const routeHandler = router.post.mock.calls[0][1];
    await routeHandler({}, { body: { perPage: 10, page: 1, type: 'internal' } }, { ok: jest.fn() });

    expect(mockHandler.getUsers).toHaveBeenCalledWith(
      { perPage: 10, page: 1, type: 'internal' },
      expect.anything(),
      expect.anything()
    );
  });

  it('should call the getRoles method of the source handler for /identity/_roles', async () => {
    const routeHandler = router.post.mock.calls[1][1];
    await routeHandler({}, { body: { perPage: 10, page: 1, type: 'internal' } }, { ok: jest.fn() });

    expect(mockHandler.getRoles).toHaveBeenCalledWith(
      { perPage: 10, page: 1, type: 'internal' },
      expect.anything(),
      expect.anything()
    );
  });
});
