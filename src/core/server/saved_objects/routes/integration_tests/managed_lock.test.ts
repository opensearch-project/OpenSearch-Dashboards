/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { registerCreateRoute } from '../create';
import { registerUpdateRoute } from '../update';
import { registerDeleteRoute } from '../delete';
import { registerBulkCreateRoute } from '../bulk_create';
import { registerBulkUpdateRoute } from '../bulk_update';
import { savedObjectsClientMock } from '../../../../../core/server/mocks';
import { setupServer } from '../test_utils';
import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';
import { SavedObjectsErrorHelpers } from '../../service';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

// Helper: a managed saved object (has managed-by: osdctl label)
const managedObject = (type: string, id: string) => ({
  type,
  id,
  attributes: {
    title: 'Managed object',
    labels: { 'managed-by': 'osdctl' },
  },
  references: [],
});

// Helper: an unmanaged saved object
const unmanagedObject = (type: string, id: string) => ({
  type,
  id,
  attributes: {
    title: 'Unmanaged object',
  },
  references: [],
});

describe('Managed lock enforcement', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    savedObjectsClient = handlerContext.savedObjects.client;

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerCreateRoute(router);
    registerUpdateRoute(router);
    registerDeleteRoute(router);
    registerBulkCreateRoute(router);
    registerBulkUpdateRoute(router);

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  // ─── CREATE (overwrite) ─────────────────────────────────────────

  describe('POST /api/saved_objects/{type}/{id} (create with overwrite)', () => {
    it('returns 409 when overwriting a managed object', async () => {
      savedObjectsClient.get.mockResolvedValue(managedObject('dashboard', 'dash-1') as any);

      const result = await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/dashboard/dash-1?overwrite=true')
        .send({ attributes: { title: 'New title' } })
        .expect(409);

      expect(result.body.message).toContain('managed by code');
      expect(savedObjectsClient.create).not.toHaveBeenCalled();
    });

    it('allows overwrite with force=true', async () => {
      savedObjectsClient.get.mockResolvedValue(managedObject('dashboard', 'dash-1') as any);
      savedObjectsClient.create.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/dashboard/dash-1?overwrite=true&force=true')
        .send({ attributes: { title: 'New title' } })
        .expect(200);

      expect(savedObjectsClient.create).toHaveBeenCalledTimes(1);
    });

    it('allows create without overwrite (no lock check needed)', async () => {
      savedObjectsClient.create.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/dashboard/dash-1')
        .send({ attributes: { title: 'New title' } })
        .expect(200);

      // Should not call get() since overwrite is false
      expect(savedObjectsClient.get).not.toHaveBeenCalled();
      expect(savedObjectsClient.create).toHaveBeenCalledTimes(1);
    });

    it('allows overwrite when object is not managed', async () => {
      savedObjectsClient.get.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);
      savedObjectsClient.create.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/dashboard/dash-1?overwrite=true')
        .send({ attributes: { title: 'New title' } })
        .expect(200);

      expect(savedObjectsClient.create).toHaveBeenCalledTimes(1);
    });

    it('allows overwrite when object does not exist yet (404)', async () => {
      savedObjectsClient.get.mockRejectedValue(
        SavedObjectsErrorHelpers.createGenericNotFoundError('dashboard', 'dash-1')
      );
      savedObjectsClient.create.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/dashboard/dash-1?overwrite=true')
        .send({ attributes: { title: 'New title' } })
        .expect(200);

      expect(savedObjectsClient.create).toHaveBeenCalledTimes(1);
    });

    it('re-throws non-404 errors from get() during lock check', async () => {
      savedObjectsClient.get.mockRejectedValue(new Error('index unavailable'));

      await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/dashboard/dash-1?overwrite=true')
        .send({ attributes: { title: 'New title' } })
        .expect(500);

      expect(savedObjectsClient.create).not.toHaveBeenCalled();
    });
  });

  // ─── UPDATE ─────────────────────────────────────────────────────

  describe('PUT /api/saved_objects/{type}/{id} (update)', () => {
    it('returns 409 when updating a managed object', async () => {
      savedObjectsClient.get.mockResolvedValue(managedObject('dashboard', 'dash-1') as any);

      const result = await supertest(httpSetup.server.listener)
        .put('/api/saved_objects/dashboard/dash-1')
        .send({ attributes: { title: 'Updated' } })
        .expect(409);

      expect(result.body.message).toContain('managed by code');
      expect(savedObjectsClient.update).not.toHaveBeenCalled();
    });

    it('allows update with force=true', async () => {
      savedObjectsClient.get.mockResolvedValue(managedObject('dashboard', 'dash-1') as any);
      savedObjectsClient.update.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .put('/api/saved_objects/dashboard/dash-1?force=true')
        .send({ attributes: { title: 'Updated' } })
        .expect(200);

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
    });

    it('allows update when object is not managed', async () => {
      savedObjectsClient.get.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);
      savedObjectsClient.update.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .put('/api/saved_objects/dashboard/dash-1')
        .send({ attributes: { title: 'Updated' } })
        .expect(200);

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
    });

    it('re-throws non-404 errors from get() during lock check', async () => {
      savedObjectsClient.get.mockRejectedValue(new Error('permission denied'));

      await supertest(httpSetup.server.listener)
        .put('/api/saved_objects/dashboard/dash-1')
        .send({ attributes: { title: 'Updated' } })
        .expect(500);

      expect(savedObjectsClient.update).not.toHaveBeenCalled();
    });
  });

  // ─── DELETE ─────────────────────────────────────────────────────

  describe('DELETE /api/saved_objects/{type}/{id}', () => {
    it('returns 409 when deleting a managed object', async () => {
      savedObjectsClient.get.mockResolvedValue(managedObject('dashboard', 'dash-1') as any);

      const result = await supertest(httpSetup.server.listener)
        .delete('/api/saved_objects/dashboard/dash-1')
        .expect(409);

      expect(result.body.message).toContain('managed by code');
      expect(savedObjectsClient.delete).not.toHaveBeenCalled();
    });

    it('allows delete with force=true', async () => {
      savedObjectsClient.get.mockResolvedValue(managedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .delete('/api/saved_objects/dashboard/dash-1?force=true')
        .expect(200);

      expect(savedObjectsClient.delete).toHaveBeenCalledTimes(1);
      // force should NOT be forwarded to client.delete()
      expect(savedObjectsClient.delete).toHaveBeenCalledWith('dashboard', 'dash-1');
    });

    it('allows delete when object is not managed', async () => {
      savedObjectsClient.get.mockResolvedValue(unmanagedObject('dashboard', 'dash-1') as any);

      await supertest(httpSetup.server.listener)
        .delete('/api/saved_objects/dashboard/dash-1')
        .expect(200);

      expect(savedObjectsClient.delete).toHaveBeenCalledTimes(1);
    });

    it('re-throws non-404 errors from get() during lock check', async () => {
      savedObjectsClient.get.mockRejectedValue(new Error('cluster unavailable'));

      await supertest(httpSetup.server.listener)
        .delete('/api/saved_objects/dashboard/dash-1')
        .expect(500);

      expect(savedObjectsClient.delete).not.toHaveBeenCalled();
    });
  });

  // ─── BULK CREATE ────────────────────────────────────────────────

  describe('POST /api/saved_objects/_bulk_create (with overwrite)', () => {
    it('filters out managed objects and reports per-item errors', async () => {
      savedObjectsClient.bulkGet.mockResolvedValue({
        saved_objects: [
          managedObject('dashboard', 'dash-1') as any,
          unmanagedObject('visualization', 'viz-1') as any,
        ],
      });
      savedObjectsClient.bulkCreate.mockResolvedValue({
        saved_objects: [
          { type: 'visualization', id: 'viz-1', attributes: {}, references: [] },
        ],
      } as any);

      const result = await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/_bulk_create?overwrite=true')
        .send([
          { type: 'dashboard', id: 'dash-1', attributes: { title: 'D1' } },
          { type: 'visualization', id: 'viz-1', attributes: { title: 'V1' } },
        ])
        .expect(200);

      // bulkCreate should only receive the unmanaged object
      expect(savedObjectsClient.bulkCreate).toHaveBeenCalledTimes(1);
      const createArgs = savedObjectsClient.bulkCreate.mock.calls[0][0];
      expect(createArgs).toHaveLength(1);
      expect(createArgs[0].id).toBe('viz-1');

      // Response should include the locked object as an error
      const lockedResult = result.body.saved_objects.find(
        (o: any) => o.type === 'dashboard' && o.id === 'dash-1'
      );
      expect(lockedResult.error.statusCode).toBe(409);
    });

    it('allows all objects with force=true', async () => {
      savedObjectsClient.bulkCreate.mockResolvedValue({
        saved_objects: [
          { type: 'dashboard', id: 'dash-1', attributes: {}, references: [] },
        ],
      } as any);

      await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/_bulk_create?overwrite=true&force=true')
        .send([
          { type: 'dashboard', id: 'dash-1', attributes: { title: 'D1' } },
        ])
        .expect(200);

      // Should not call bulkGet for lock checks
      expect(savedObjectsClient.bulkGet).not.toHaveBeenCalled();
      expect(savedObjectsClient.bulkCreate).toHaveBeenCalledTimes(1);
    });

    it('skips lock check when overwrite is false', async () => {
      savedObjectsClient.bulkCreate.mockResolvedValue({
        saved_objects: [],
      } as any);

      await supertest(httpSetup.server.listener)
        .post('/api/saved_objects/_bulk_create')
        .send([
          { type: 'dashboard', id: 'dash-1', attributes: { title: 'D1' } },
        ])
        .expect(200);

      expect(savedObjectsClient.bulkGet).not.toHaveBeenCalled();
    });
  });

  // ─── BULK UPDATE ────────────────────────────────────────────────

  describe('PUT /api/saved_objects/_bulk_update', () => {
    it('filters out managed objects and reports per-item errors', async () => {
      savedObjectsClient.bulkGet.mockResolvedValue({
        saved_objects: [
          managedObject('dashboard', 'dash-1') as any,
          unmanagedObject('visualization', 'viz-1') as any,
        ],
      });
      savedObjectsClient.bulkUpdate.mockResolvedValue({
        saved_objects: [
          { type: 'visualization', id: 'viz-1', attributes: {}, references: [] },
        ],
      } as any);

      const result = await supertest(httpSetup.server.listener)
        .put('/api/saved_objects/_bulk_update')
        .send([
          { type: 'dashboard', id: 'dash-1', attributes: { title: 'D1' } },
          { type: 'visualization', id: 'viz-1', attributes: { title: 'V1' } },
        ])
        .expect(200);

      // bulkUpdate should only receive the unmanaged object
      expect(savedObjectsClient.bulkUpdate).toHaveBeenCalledTimes(1);
      const updateArgs = savedObjectsClient.bulkUpdate.mock.calls[0][0];
      expect(updateArgs).toHaveLength(1);
      expect(updateArgs[0].id).toBe('viz-1');

      // Response should include the locked object as an error
      const lockedResult = result.body.saved_objects.find(
        (o: any) => o.type === 'dashboard' && o.id === 'dash-1'
      );
      expect(lockedResult.error.statusCode).toBe(409);
    });

    it('allows all objects with force=true', async () => {
      savedObjectsClient.bulkUpdate.mockResolvedValue({
        saved_objects: [],
      } as any);

      await supertest(httpSetup.server.listener)
        .put('/api/saved_objects/_bulk_update?force=true')
        .send([
          { type: 'dashboard', id: 'dash-1', attributes: { title: 'D1' } },
        ])
        .expect(200);

      // Should not call bulkGet for lock checks
      expect(savedObjectsClient.bulkGet).not.toHaveBeenCalled();
      expect(savedObjectsClient.bulkUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
