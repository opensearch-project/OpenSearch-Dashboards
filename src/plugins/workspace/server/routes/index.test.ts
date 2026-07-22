/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';

import { setupServer } from '../../../../core/server/test_utils';
import { loggingSystemMock, dynamicConfigServiceMock } from '../../../../core/server/mocks';

import { workspaceClientMock } from '../workspace_client.mock';

import { registerRoutes, WORKSPACES_API_BASE_URL } from './index';
import { IWorkspaceClientImpl } from '../types';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;
const mockDynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();

describe(`Workspace routes`, () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let mockedWorkspaceClient: IWorkspaceClientImpl;

  beforeEach(async () => {
    ({ server, httpSetup } = await setupServer());

    const router = httpSetup.createRouter('');

    mockedWorkspaceClient = workspaceClientMock.create();

    registerRoutes({
      router,
      client: mockedWorkspaceClient,
      logger: loggingSystemMock.create().get(),
      maxImportExportSize: Number.MAX_SAFE_INTEGER,
      isPermissionControlEnabled: false,
      isDataSourceEnabled: true,
    });

    await server.start({ dynamicConfigService: mockDynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('creates a workspace successfully', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(WORKSPACES_API_BASE_URL)
      .send({
        attributes: {
          name: 'Observability',
          features: ['use-case-observability'],
        },
      })
      .expect(200);
    expect(result.body).toEqual({ id: expect.any(String) });
    expect(mockedWorkspaceClient.create).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        name: 'Observability',
        features: ['use-case-observability'],
      })
    );
  });

  /**
   * This test verifies that the get route returns the exact error message
   * "Invalid saved objects permission" when a user lacks access to a workspace.
   * The public-side code in workspace_validation_service.ts relies on this exact
   * error string to redirect the user to the fatal error page. If this error
   * message changes, the client-side check must be updated accordingly.
   */
  it('get should return permission error when workspace client returns permission error', async () => {
    (mockedWorkspaceClient.get as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Invalid saved objects permission',
    });

    const result = await supertest(httpSetup.server.listener)
      .get(`${WORKSPACES_API_BASE_URL}/mock-workspace-id`)
      .expect(200);

    expect(result.body).toEqual({
      success: false,
      error: 'Invalid saved objects permission',
    });
  });

  describe('feature validation', () => {
    it('returns 400 when no features is provided during workspace creation', async () => {
      await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send({
          attributes: {
            name: 'Observability',
          },
        })
        .expect(400);
    });
    it('returns 400 when no valid use case is provided during workspace creation', async () => {
      const result = await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send({
          attributes: {
            name: 'Observability',
            features: ['use-case-valid'],
          },
        })
        .expect(400);
      expect(result.body.message).toEqual(
        '[request body.attributes.features]: At least one use case is required. Valid options: use-case-all, use-case-observability, use-case-security-analytics, use-case-essentials, use-case-search'
      );
    });
    it('returns 400 when multiple use cases are provided during workspace creation', async () => {
      const result = await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send({
          attributes: {
            name: 'Observability',
            features: ['use-case-observability', 'use-case-all'],
          },
        })
        .expect(400);
      expect(result.body.message).toEqual(
        '[request body.attributes.features]: Only one use case is allowed per workspace.'
      );
    });
    it('returns 400 when no valid use case is provided during workspace update', async () => {
      const result = await supertest(httpSetup.server.listener)
        .put(`${WORKSPACES_API_BASE_URL}/mock-workspace-id`)
        .send({
          attributes: {
            name: 'Observability',
            features: ['feature1', 'feature2'],
          },
        })
        .expect(400);
      expect(result.body.message).toEqual(
        '[request body.attributes.features]: At least one use case is required. Valid options: use-case-all, use-case-observability, use-case-security-analytics, use-case-essentials, use-case-search'
      );
    });
    it('updates workspace name successfully without modifying features', async () => {
      await supertest(httpSetup.server.listener)
        .put(`${WORKSPACES_API_BASE_URL}/mock-workspace-id`)
        .send({
          attributes: {
            name: 'Observability',
          },
        })
        .expect(200);
    });
  });
});

describe(`Workspace routes permission validation`, () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let mockedWorkspaceClient: IWorkspaceClientImpl;

  beforeEach(async () => {
    ({ server, httpSetup } = await setupServer());

    const router = httpSetup.createRouter('');

    mockedWorkspaceClient = workspaceClientMock.create();
    (mockedWorkspaceClient.update as jest.Mock).mockResolvedValue({
      success: true,
      result: true,
    });

    registerRoutes({
      router,
      client: mockedWorkspaceClient,
      logger: loggingSystemMock.create().get(),
      maxImportExportSize: Number.MAX_SAFE_INTEGER,
      // Permission validation/normalization only runs when permission control is enabled.
      isPermissionControlEnabled: true,
      isDataSourceEnabled: true,
    });

    await server.start({ dynamicConfigService: mockDynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('create', () => {
    it('returns 400 when a group has an incomplete permission combination', async () => {
      const result = await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send({
          attributes: {
            name: 'Observability',
            features: ['use-case-observability'],
          },
          settings: {
            permissions: {
              read: { groups: ['obs-users'] },
            },
          },
        })
        .expect(400);
      expect(result.body.message).toContain('Invalid workspace permissions');
      expect(result.body.message).toContain('obs-users');
      expect(mockedWorkspaceClient.create).not.toHaveBeenCalled();
    });

    it('persists a valid read only collaborator unchanged', async () => {
      await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send({
          attributes: {
            name: 'Observability',
            features: ['use-case-observability'],
          },
          settings: {
            permissions: {
              library_read: { groups: ['obs-users'] },
              read: { groups: ['obs-users'] },
            },
          },
        })
        .expect(200);
      expect(mockedWorkspaceClient.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          permissions: {
            library_read: { groups: ['obs-users'] },
            read: { groups: ['obs-users'] },
          },
        })
      );
    });

    it('normalizes a redundant permission combination to a single access level before persisting', async () => {
      await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send({
          attributes: {
            name: 'Observability',
            features: ['use-case-observability'],
          },
          settings: {
            permissions: {
              library_write: { users: ['admin'] },
              write: { users: ['admin'] },
              library_read: { users: ['admin'] },
              read: { users: ['admin'] },
            },
          },
        })
        .expect(200);
      expect(mockedWorkspaceClient.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          permissions: {
            library_write: { users: ['admin'] },
            write: { users: ['admin'] },
          },
        })
      );
    });
  });

  describe('update', () => {
    it('returns 400 when permissions have an incomplete combination', async () => {
      const result = await supertest(httpSetup.server.listener)
        .put(`${WORKSPACES_API_BASE_URL}/mock-workspace-id`)
        .send({
          attributes: {},
          settings: {
            permissions: {
              library_write: { groups: ['obs-admins'] },
              read: { groups: ['obs-users'] },
            },
          },
        })
        .expect(400);
      expect(result.body.message).toContain('Invalid workspace permissions');
      expect(result.body.message).toContain('obs-admins');
      expect(result.body.message).toContain('obs-users');
      expect(mockedWorkspaceClient.update).not.toHaveBeenCalled();
    });

    it('normalizes a redundant permission combination before calling the workspace client', async () => {
      await supertest(httpSetup.server.listener)
        .put(`${WORKSPACES_API_BASE_URL}/mock-workspace-id`)
        .send({
          attributes: {},
          settings: {
            permissions: {
              library_write: { users: ['admin'] },
              write: { users: ['admin'] },
              library_read: { users: ['admin'] },
              read: { users: ['admin'] },
            },
          },
        })
        .expect(200);
      expect(mockedWorkspaceClient.update).toHaveBeenCalledWith(
        expect.any(Object),
        'mock-workspace-id',
        expect.objectContaining({
          permissions: {
            library_write: { users: ['admin'] },
            write: { users: ['admin'] },
          },
        })
      );
    });
  });
});
