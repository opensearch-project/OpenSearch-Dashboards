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
    getNamesWithIds?: jest.Mock;
    getRolesWithIds?: jest.Mock;
  };

  beforeEach(async () => {
    router = mockRouter.create();
    mockHandler = {
      getUsers: jest.fn(),
      getRoles: jest.fn(),
      getNamesWithIds: jest.fn(),
      getRolesWithIds: jest.fn(),
    };

    identitySourceService = ({
      getIdentitySourceHandler: jest.fn().mockReturnValue(mockHandler),
    } as unknown) as jest.Mocked<IdentitySourceService>;

    registerRoutes({ router, identitySourceService });
  });

  it('registers the capabilities routes', async () => {
    expect(router.get).toHaveBeenCalledTimes(4);
    expect(router.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'identity/{source}/_users',
      }),
      expect.any(Function)
    );
    expect(router.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'identity/{source}/_roles',
      }),
      expect.any(Function)
    );
    expect(router.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'identity/{source}/_get_users_name',
      }),
      expect.any(Function)
    );
    expect(router.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'identity/{source}/_get_roles_name',
      }),
      expect.any(Function)
    );
  });

  it('should call the getUsers method of the source handler for identity/_users', async () => {
    const routeHandler = router.get.mock.calls[0][1];
    const mockRequest = {
      params: { source: 'test' },
      query: { perPage: 10, page: 1 },
    };
    await routeHandler({}, mockRequest, { ok: jest.fn() });

    expect(mockHandler.getUsers).toHaveBeenCalledWith(
      { perPage: 10, page: 1 },
      expect.anything(),
      expect.anything()
    );
  });

  it('should call the getRoles method of the source handler for identity/_roles', async () => {
    const routeHandler = router.get.mock.calls[1][1];
    const mockRequest = {
      params: { source: 'test' },
      query: { perPage: 10, page: 1 },
    };
    await routeHandler({}, mockRequest, { ok: jest.fn() });

    expect(mockHandler.getRoles).toHaveBeenCalledWith(
      { perPage: 10, page: 1 },
      expect.anything(),
      expect.anything()
    );
  });

  it('should call the getNamesWithIds method of the source handler for identity/{source}/_get_users_name', async () => {
    const routeHandler = router.get.mock.calls[2][1];
    const mockRequest = {
      params: { source: 'test' },
      query: { userIds: ['user_id_1'] },
    };
    await routeHandler({}, mockRequest, { ok: jest.fn() });

    expect(mockHandler.getNamesWithIds).toHaveBeenCalledWith(
      { userIds: ['user_id_1'] },
      expect.anything(),
      expect.anything()
    );
  });

  it('should call the getRolesWithIds method of the source handler for identity/{source}/_get_roles_name', async () => {
    const routeHandler = router.get.mock.calls[3][1];
    const mockRequest = {
      params: { source: 'test' },
      query: { roleIds: ['role_id_1'] },
    };
    await routeHandler({}, mockRequest, { ok: jest.fn() });

    expect(mockHandler.getRolesWithIds).toHaveBeenCalledWith(
      { roleIds: ['role_id_1'] },
      expect.anything(),
      expect.anything()
    );
  });
});
