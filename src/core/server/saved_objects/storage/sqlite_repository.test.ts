/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SqliteSavedObjectsRepository } from './sqlite_repository';
import { SavedObjectTypeRegistry } from '../saved_objects_type_registry';
import { SavedObjectsSerializer } from '../serialization';

const createMockMigrator = () => ({
  migrateDocument: jest.fn((doc: any) => doc),
  runMigrations: jest.fn(),
  getStatus$: jest.fn(),
  getActiveMappings: jest.fn().mockReturnValue({ properties: {} }),
});

const createRepo = () => {
  const migrator = createMockMigrator();
  const typeRegistry = new SavedObjectTypeRegistry();
  const serializer = new SavedObjectsSerializer(typeRegistry);
  const repo = new SqliteSavedObjectsRepository({
    dbPath: ':memory:',
    migrator: migrator as any,
    typeRegistry,
    serializer,
  });
  return { repo, migrator };
};

describe('SqliteSavedObjectsRepository', () => {
  let repo: SqliteSavedObjectsRepository;
  let migrator: ReturnType<typeof createMockMigrator>;

  beforeEach(() => {
    ({ repo, migrator } = createRepo());
  });

  afterEach(() => {
    repo.shutdown();
  });

  describe('create', () => {
    it('creates and returns a saved object', async () => {
      const result = await repo.create('dashboard', { title: 'Test' }, { id: 'dash-1' });
      expect(result.id).toBe('dash-1');
      expect(result.type).toBe('dashboard');
      expect(result.attributes).toEqual({ title: 'Test' });
      expect(result.version).toBe('1');
    });

    it('calls migrateDocument on create', async () => {
      await repo.create('dashboard', { title: 'Test' }, { id: 'dash-1' });
      expect(migrator.migrateDocument).toHaveBeenCalled();
    });

    it('generates id when none provided', async () => {
      const result = await repo.create('dashboard', { title: 'Test' });
      expect(result.id).toBeTruthy();
    });

    it('throws conflict on duplicate without overwrite', async () => {
      await repo.create('dashboard', { title: 'Test' }, { id: 'dup' });
      await expect(repo.create('dashboard', { title: 'Test2' }, { id: 'dup' })).rejects.toThrow();
    });

    it('allows overwrite and increments version', async () => {
      await repo.create('dashboard', { title: 'V1' }, { id: 'ow' });
      const updated = await repo.create(
        'dashboard',
        { title: 'V2' },
        { id: 'ow', overwrite: true }
      );
      expect(updated.version).toBe('2');
      expect(updated.attributes).toEqual({ title: 'V2' });
    });
  });

  describe('get', () => {
    it('retrieves a saved object and migrates it', async () => {
      await repo.create('dashboard', { title: 'Test' }, { id: 'g-1' });
      const result = await repo.get('dashboard', 'g-1');
      expect(result.attributes).toEqual({ title: 'Test' });
      expect(migrator.migrateDocument).toHaveBeenCalled();
    });

    it('throws not found for missing objects', async () => {
      await expect(repo.get('dashboard', 'missing')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('merges attributes and migrates', async () => {
      await repo.create('dashboard', { title: 'Old', hits: 0 }, { id: 'u-1' });
      const updated = await repo.update('dashboard', 'u-1', { title: 'New' });
      expect(updated.attributes).toEqual({ title: 'New', hits: 0 });
      expect(updated.version).toBe('2');
    });

    it('throws conflict on version mismatch', async () => {
      await repo.create('dashboard', { title: 'Test' }, { id: 'u-2' });
      await expect(
        repo.update('dashboard', 'u-2', { title: 'New' }, { version: '99' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes an existing object', async () => {
      await repo.create('dashboard', { title: 'Test' }, { id: 'del-1' });
      await repo.delete('dashboard', 'del-1');
      await expect(repo.get('dashboard', 'del-1')).rejects.toThrow();
    });

    it('throws not found for missing objects', async () => {
      await expect(repo.delete('dashboard', 'missing')).rejects.toThrow();
    });
  });

  describe('bulkCreate', () => {
    it('creates multiple objects in a transaction', async () => {
      const result = await repo.bulkCreate([
        { type: 'dashboard', id: 'bc-1', attributes: { title: 'A' } },
        { type: 'dashboard', id: 'bc-2', attributes: { title: 'B' } },
      ]);
      expect(result.saved_objects).toHaveLength(2);
      expect(result.saved_objects[0].error).toBeUndefined();
      expect(result.saved_objects[1].error).toBeUndefined();
    });

    it('returns errors for conflicts without failing the batch', async () => {
      await repo.create('dashboard', { title: 'Existing' }, { id: 'bc-dup' });
      const result = await repo.bulkCreate([
        { type: 'dashboard', id: 'bc-dup', attributes: { title: 'Dup' } },
        { type: 'dashboard', id: 'bc-new', attributes: { title: 'New' } },
      ]);
      expect(result.saved_objects[0].error).toBeDefined();
      expect(result.saved_objects[1].error).toBeUndefined();
    });
  });

  describe('bulkGet', () => {
    it('retrieves multiple objects with migration', async () => {
      await repo.create('dashboard', { title: 'A' }, { id: 'bg-1' });
      await repo.create('dashboard', { title: 'B' }, { id: 'bg-2' });
      const result = await repo.bulkGet([
        { type: 'dashboard', id: 'bg-1' },
        { type: 'dashboard', id: 'bg-2' },
        { type: 'dashboard', id: 'missing' },
      ]);
      expect(result.saved_objects[0].attributes).toEqual({ title: 'A' });
      expect(result.saved_objects[1].attributes).toEqual({ title: 'B' });
      expect(result.saved_objects[2].error).toBeDefined();
    });
  });

  describe('find', () => {
    it('finds objects by type', async () => {
      await repo.create('dashboard', { title: 'D1' }, { id: 'f-1' });
      await repo.create('visualization', { title: 'V1' }, { id: 'f-2' });
      const result = await repo.find({ type: 'dashboard' });
      expect(result.total).toBe(1);
      expect(result.saved_objects[0].type).toBe('dashboard');
    });

    it('supports pagination', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create('dashboard', { title: `D${i}` }, { id: `fp-${i}` });
      }
      const page1 = await repo.find({ type: 'dashboard', perPage: 2, page: 1 });
      expect(page1.total).toBe(5);
      expect(page1.saved_objects).toHaveLength(2);
    });

    it('supports text search', async () => {
      await repo.create('dashboard', { title: 'Alpha' }, { id: 'fs-1' });
      await repo.create('dashboard', { title: 'Beta' }, { id: 'fs-2' });
      const result = await repo.find({ type: 'dashboard', search: 'Alpha' });
      expect(result.total).toBe(1);
    });

    it('migrates results', async () => {
      await repo.create('dashboard', { title: 'Test' }, { id: 'fm-1' });
      migrator.migrateDocument.mockClear();
      await repo.find({ type: 'dashboard' });
      expect(migrator.migrateDocument).toHaveBeenCalled();
    });
  });

  describe('checkConflicts', () => {
    it('detects existing objects', async () => {
      await repo.create('dashboard', { title: 'Test' }, { id: 'cc-1' });
      const result = await repo.checkConflicts([
        { type: 'dashboard', id: 'cc-1' },
        { type: 'dashboard', id: 'cc-missing' },
      ]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].id).toBe('cc-1');
    });
  });

  describe('incrementCounter', () => {
    it('creates and increments', async () => {
      const first = await repo.incrementCounter('config', 'hits', 'count');
      expect(first.attributes).toEqual({ count: 1 });
      const second = await repo.incrementCounter('config', 'hits', 'count');
      expect(second.attributes).toEqual({ count: 2 });
    });
  });

  describe('bulkUpdate', () => {
    it('updates multiple objects', async () => {
      await repo.create('dashboard', { title: 'A', hits: 0 }, { id: 'bu-1' });
      await repo.create('dashboard', { title: 'B', hits: 0 }, { id: 'bu-2' });
      const result = await repo.bulkUpdate([
        { type: 'dashboard', id: 'bu-1', attributes: { hits: 10 } },
        { type: 'dashboard', id: 'bu-2', attributes: { hits: 20 } },
        { type: 'dashboard', id: 'missing', attributes: { hits: 0 } },
      ]);
      expect(result.saved_objects[0].attributes).toMatchObject({ hits: 10 });
      expect(result.saved_objects[1].attributes).toMatchObject({ hits: 20 });
      expect(result.saved_objects[2].error).toBeDefined();
    });
  });

  describe('workspaces', () => {
    it('stores and finds by workspace', async () => {
      await repo.create('dashboard', { title: 'WS' }, { id: 'ws-1', workspaces: ['ws-a'] });
      await repo.create('dashboard', { title: 'Global' }, { id: 'ws-2' });
      const result = await repo.find({ type: 'dashboard', workspaces: ['ws-a'] });
      expect(result.total).toBe(1);
      expect(result.saved_objects[0].id).toBe('ws-1');
    });
  });

  describe('namespaces', () => {
    it('isolates objects by namespace', async () => {
      await repo.create('dashboard', { title: 'NS1' }, { id: 'ns-1', namespace: 'alpha' });
      await repo.create('dashboard', { title: 'NS2' }, { id: 'ns-1', namespace: 'beta' });
      const a = await repo.get('dashboard', 'ns-1', { namespace: 'alpha' });
      const b = await repo.get('dashboard', 'ns-1', { namespace: 'beta' });
      expect(a.attributes).toEqual({ title: 'NS1' });
      expect(b.attributes).toEqual({ title: 'NS2' });
    });
  });

  describe('deleteByNamespace', () => {
    it('deletes all objects in a namespace', async () => {
      await repo.create('dashboard', { title: 'A' }, { id: 'dn-1', namespace: 'doomed' });
      await repo.create('dashboard', { title: 'B' }, { id: 'dn-2', namespace: 'doomed' });
      await repo.create('dashboard', { title: 'C' }, { id: 'dn-3', namespace: 'safe' });
      await repo.deleteByNamespace('doomed');
      await expect(repo.get('dashboard', 'dn-1', { namespace: 'doomed' })).rejects.toThrow();
      const safe = await repo.get('dashboard', 'dn-3', { namespace: 'safe' });
      expect(safe.attributes).toEqual({ title: 'C' });
    });
  });

  describe('deleteByWorkspace', () => {
    it('deletes all objects in a workspace', async () => {
      await repo.create('dashboard', { title: 'WS' }, { id: 'dw-1', workspaces: ['doomed-ws'] });
      await repo.create('dashboard', { title: 'Safe' }, { id: 'dw-2', workspaces: ['safe-ws'] });
      await repo.create('dashboard', { title: 'NoWS' }, { id: 'dw-3' });
      await repo.deleteByWorkspace('doomed-ws');
      // doomed workspace object should be gone
      const all = await repo.find({ type: 'dashboard' });
      const ids = all.saved_objects.map((o: any) => o.id);
      expect(ids).not.toContain('dw-1');
      expect(ids).toContain('dw-2');
      expect(ids).toContain('dw-3');
    });
  });

  describe('find with hasReference', () => {
    it('filters by reference type and id', async () => {
      await repo.create(
        'visualization',
        { title: 'Viz with ref' },
        {
          id: 'hr-1',
          references: [{ name: 'idx', type: 'index-pattern', id: 'logs-*' }],
        }
      );
      await repo.create('visualization', { title: 'Viz no ref' }, { id: 'hr-2' });
      const result = await repo.find({
        type: 'visualization',
        hasReference: { type: 'index-pattern', id: 'logs-*' },
      });
      expect(result.total).toBe(1);
      expect(result.saved_objects[0].id).toBe('hr-1');
    });
  });

  describe('find with workspaces filter', () => {
    it('returns only objects in the specified workspace', async () => {
      await repo.create('dashboard', { title: 'WS-A' }, { id: 'fw-1', workspaces: ['ws-a'] });
      await repo.create('dashboard', { title: 'WS-B' }, { id: 'fw-2', workspaces: ['ws-b'] });
      await repo.create(
        'dashboard',
        { title: 'Both' },
        { id: 'fw-3', workspaces: ['ws-a', 'ws-b'] }
      );
      const result = await repo.find({ type: 'dashboard', workspaces: ['ws-a'] });
      expect(result.total).toBe(2);
      const ids = result.saved_objects.map((o: any) => o.id).sort();
      expect(ids).toEqual(['fw-1', 'fw-3']);
    });
  });

  describe('document migration', () => {
    it('transforms attributes on create via migrator', async () => {
      migrator.migrateDocument.mockImplementation((doc: any) => ({
        ...doc,
        attributes: { ...doc.attributes, migrated: true },
        migrationVersion: { dashboard: '2.0.0' },
      }));

      const result = await repo.create('dashboard', { title: 'Test' }, { id: 'mc-1' });
      expect(result.attributes).toEqual({ title: 'Test', migrated: true });

      // Stored value should also be migrated
      migrator.migrateDocument.mockImplementation((doc: any) => doc);
      const fetched = await repo.get('dashboard', 'mc-1');
      expect(fetched.attributes).toEqual({ title: 'Test', migrated: true });
    });

    it('transforms attributes on read via migrator', async () => {
      // Create without transformation
      await repo.create('dashboard', { title: 'Old', version: 1 }, { id: 'mr-1' });

      // Simulate a migration that adds a field on read
      migrator.migrateDocument.mockImplementation((doc: any) => ({
        ...doc,
        attributes: { ...doc.attributes, newField: 'added-by-migration' },
        migrationVersion: { dashboard: '3.0.0' },
      }));

      const fetched = await repo.get('dashboard', 'mr-1');
      expect(fetched.attributes).toEqual({
        title: 'Old',
        version: 1,
        newField: 'added-by-migration',
      });
    });

    it('transforms attributes on find via migrator', async () => {
      await repo.create('dashboard', { title: 'A' }, { id: 'mf-1' });
      await repo.create('dashboard', { title: 'B' }, { id: 'mf-2' });

      migrator.migrateDocument.mockImplementation((doc: any) => ({
        ...doc,
        attributes: { ...doc.attributes, found: true },
      }));

      const result = await repo.find({ type: 'dashboard' });
      expect((result.saved_objects[0].attributes as any).found).toBe(true);
      expect((result.saved_objects[1].attributes as any).found).toBe(true);
    });

    it('transforms attributes on update via migrator', async () => {
      await repo.create('dashboard', { title: 'V1' }, { id: 'mu-1' });

      migrator.migrateDocument.mockImplementation((doc: any) => ({
        ...doc,
        attributes: { ...doc.attributes, autoFixed: true },
      }));

      const updated = await repo.update('dashboard', 'mu-1', { title: 'V2' });
      expect(updated.attributes).toMatchObject({ title: 'V2', autoFixed: true });
    });

    it('transforms attributes on bulkGet via migrator', async () => {
      await repo.create('dashboard', { title: 'Bulk' }, { id: 'mbg-1' });

      migrator.migrateDocument.mockImplementation((doc: any) => ({
        ...doc,
        attributes: { ...doc.attributes, bulkMigrated: true },
      }));

      const result = await repo.bulkGet([{ type: 'dashboard', id: 'mbg-1' }]);
      expect((result.saved_objects[0].attributes as any).bulkMigrated).toBe(true);
    });
  });
});
