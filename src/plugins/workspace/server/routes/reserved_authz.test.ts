/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';

import { setupServer } from '../../../../core/server/test_utils';
import { loggingSystemMock, dynamicConfigServiceMock } from '../../../../core/server/mocks';
import { updateWorkspaceState } from '../../../../core/server/utils';

import { workspaceClientMock } from '../workspace_client.mock';
import { registerRoutes, WORKSPACES_API_BASE_URL } from './index';
import { IWorkspaceClientImpl } from '../types';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;
const mockDynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();

// Lets each test choose whether the caller is a dashboard admin, the way the workspace plugin's
// onPostAuth handler would.
const DASHBOARD_ADMIN_HEADER = 'x-test-dashboard-admin';

describe('Workspace routes - reserved attribute', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let client: IWorkspaceClientImpl;

  const start = async (isPermissionControlEnabled: boolean) => {
    ({ server, httpSetup } = await setupServer());

    httpSetup.registerOnPostAuth((request, response, toolkit) => {
      if (request.headers[DASHBOARD_ADMIN_HEADER] === 'true') {
        updateWorkspaceState(request, { isDashboardAdmin: true });
      }
      return toolkit.next();
    });

    client = workspaceClientMock.create();
    (client.create as jest.Mock).mockResolvedValue({ success: true, result: { id: 'ws-id' } });
    (client.update as jest.Mock).mockResolvedValue({ success: true, result: true });

    registerRoutes({
      router: httpSetup.createRouter(''),
      client,
      logger: loggingSystemMock.create().get(),
      maxImportExportSize: Number.MAX_SAFE_INTEGER,
      isPermissionControlEnabled,
      isDataSourceEnabled: true,
    });

    await server.start({ dynamicConfigService: mockDynamicConfigService });
  };

  const createBody = (reserved?: boolean) => ({
    attributes: {
      name: 'Observability',
      features: ['use-case-observability'],
      ...(reserved === undefined ? {} : { reserved }),
    },
    settings: {},
  });

  const createdAttributes = () => (client.create as jest.Mock).mock.calls[0][1];
  const updatedAttributes = () => (client.update as jest.Mock).mock.calls[0][2];

  afterEach(async () => {
    await server.stop();
  });

  describe('with permission control enabled', () => {
    beforeEach(() => start(true));

    it('drops reserved on create for a caller who is not a dashboard admin', async () => {
      await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send(createBody(true))
        .expect(200);

      expect(createdAttributes()).not.toHaveProperty('reserved');
      expect(createdAttributes().name).toBe('Observability');
    });

    it('drops reserved on update for a caller who is not a dashboard admin', async () => {
      await supertest(httpSetup.server.listener)
        .put(`${WORKSPACES_API_BASE_URL}/ws-id`)
        .send(createBody(true))
        .expect(200);

      expect(updatedAttributes()).not.toHaveProperty('reserved');
      expect(updatedAttributes().name).toBe('Observability');
    });

    it('does not let a caller who is not a dashboard admin clear reserved', async () => {
      await supertest(httpSetup.server.listener)
        .put(`${WORKSPACES_API_BASE_URL}/ws-id`)
        .send(createBody(false))
        .expect(200);

      expect(updatedAttributes()).not.toHaveProperty('reserved');
    });

    it('keeps reserved on create for a dashboard admin', async () => {
      await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .set(DASHBOARD_ADMIN_HEADER, 'true')
        .send(createBody(true))
        .expect(200);

      expect(createdAttributes().reserved).toBe(true);
    });

    it('keeps reserved on update for a dashboard admin', async () => {
      await supertest(httpSetup.server.listener)
        .put(`${WORKSPACES_API_BASE_URL}/ws-id`)
        .set(DASHBOARD_ADMIN_HEADER, 'true')
        .send(createBody(false))
        .expect(200);

      expect(updatedAttributes().reserved).toBe(false);
    });
  });

  describe('with permission control disabled', () => {
    beforeEach(() => start(false));

    it('passes reserved through, since there are no privileged callers to protect', async () => {
      await supertest(httpSetup.server.listener)
        .post(WORKSPACES_API_BASE_URL)
        .send(createBody(true))
        .expect(200);

      expect(createdAttributes().reserved).toBe(true);
    });
  });
});
