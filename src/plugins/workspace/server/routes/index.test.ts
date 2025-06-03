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
