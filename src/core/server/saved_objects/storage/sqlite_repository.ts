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

import uuid from 'uuid';
import {
  ISavedObjectsRepository,
  SavedObjectsIncrementCounterOptions,
  SavedObjectsDeleteByNamespaceOptions,
} from '../service/lib/repository';
import { IOpenSearchDashboardsMigrator } from '../migrations';
import { SavedObjectTypeRegistry } from '../saved_objects_type_registry';
import { SavedObjectsSerializer } from '../serialization';
import { SavedObjectsErrorHelpers } from '../service/lib/errors';
import {
  SavedObject,
  SavedObjectReference,
  SavedObjectsBaseOptions,
  SavedObjectsFindOptions,
} from '../types';
import {
  SavedObjectsCreateOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkGetObject,
  SavedObjectsFindResponse,
  SavedObjectsFindResult,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateOptions,
  SavedObjectsBulkUpdateResponse,
  SavedObjectsBulkResponse,
  SavedObjectsDeleteOptions,
  SavedObjectsCheckConflictsObject,
  SavedObjectsCheckConflictsResponse,
  SavedObjectsAddToNamespacesOptions,
  SavedObjectsAddToNamespacesResponse,
  SavedObjectsDeleteFromNamespacesOptions,
  SavedObjectsDeleteFromNamespacesResponse,
  SavedObjectsDeleteByWorkspaceOptions,
} from '../service/saved_objects_client';

/** Minimal type for better-sqlite3 Database instance */
interface BetterSqlite3Database {
  pragma(pragma: string): unknown;
  exec(sql: string): void;
  prepare(sql: string): BetterSqlite3Statement;
  transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T;
  close(): void;
}

interface BetterSqlite3Statement {
  run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

let Database: any;
try {
  Database = require('better-sqlite3');
} catch (e) {
  // optional dependency
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS saved_objects (
    type       TEXT    NOT NULL,
    id         TEXT    NOT NULL,
    namespace  TEXT    NOT NULL DEFAULT '',
    attributes TEXT    NOT NULL,
    "references" TEXT  NOT NULL DEFAULT '[]',
    version    INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT    NOT NULL,
    migration_version TEXT,
    origin_id  TEXT,
    workspaces TEXT,
    permissions TEXT,
    PRIMARY KEY (type, id, namespace)
  );
  CREATE INDEX IF NOT EXISTS idx_so_type ON saved_objects(type);
  CREATE INDEX IF NOT EXISTS idx_so_updated ON saved_objects(updated_at);
  CREATE INDEX IF NOT EXISTS idx_so_namespace ON saved_objects(namespace);
`;

interface RawRow {
  type: string;
  id: string;
  namespace: string;
  attributes: string;
  references: string;
  version: number;
  updated_at: string;
  migration_version: string | null;
  origin_id: string | null;
  workspaces: string | null;
  permissions: string | null;
}

import { Logger } from '../../logging';

export interface SqliteSavedObjectsRepositoryOptions {
  dbPath: string;
  migrator: IOpenSearchDashboardsMigrator;
  typeRegistry: SavedObjectTypeRegistry;
  serializer: SavedObjectsSerializer;
  includedHiddenTypes?: string[];
  logger?: Logger;
}

/**
 * SQLite implementation of ISavedObjectsRepository.
 * Implements the repository interface directly, with access to migrator,
 * type registry, and serializer — matching the OpenSearch repository pattern.
 */
export class SqliteSavedObjectsRepository implements ISavedObjectsRepository {
  private db: BetterSqlite3Database;
  private _migrator: IOpenSearchDashboardsMigrator;
  private _registry: SavedObjectTypeRegistry;
  // @ts-expect-error serializer reserved for future use (raw ID generation, type serialization)
  private _serializer: SavedObjectsSerializer;
  private _allowedTypes: string[];
  private _logger?: Logger;

  constructor(options: SqliteSavedObjectsRepositoryOptions) {
    if (!Database) {
      throw new Error('better-sqlite3 is not installed. Install it with: yarn add better-sqlite3');
    }
    this._migrator = options.migrator;
    this._registry = options.typeRegistry;
    this._serializer = options.serializer;
    this._logger = options.logger;

    const allTypes = options.typeRegistry.getAllTypes().map((t) => t.name);
    const visibleTypes = allTypes.filter((t) => !options.typeRegistry.isHidden(t));
    this._allowedTypes = [...new Set(visibleTypes.concat(options.includedHiddenTypes || []))];

    this.db = new Database(options.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA_SQL);
    this._logger?.info(`SQLite storage backend initialized at ${options.dbPath}`);
  }

  shutdown(): void {
    this.db?.close();
  }

  // --- CRUD ---

  async create<T = unknown>(
    type: string,
    attributes: T,
    options: SavedObjectsCreateOptions = {}
  ): Promise<SavedObject<T>> {
    const id = options.id || uuid.v4();
    const namespace = options.namespace || '';
    const now = new Date().toISOString();

    if (!options.overwrite) {
      const existing = this.db
        .prepare('SELECT 1 FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?')
        .get(type, id, namespace);
      if (existing) {
        throw SavedObjectsErrorHelpers.createConflictError(type, id);
      }
    }

    const migrated = this._migrator.migrateDocument({
      id,
      type,
      attributes,
      migrationVersion: options.migrationVersion,
      ...(namespace && { namespace }),
      references: options.references || [],
      updated_at: now,
    });

    const refs = JSON.stringify(migrated.references || []);
    const migVer = migrated.migrationVersion ? JSON.stringify(migrated.migrationVersion) : null;
    const ws = options.workspaces ? JSON.stringify(options.workspaces) : null;
    const perms = options.permissions ? JSON.stringify(options.permissions) : null;

    if (options.overwrite) {
      // Atomic upsert: increment version if exists, else insert with version 1
      this.db
        .prepare(
          `INSERT INTO saved_objects
           (type, id, namespace, attributes, "references", version, updated_at, migration_version, origin_id, workspaces, permissions)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
           ON CONFLICT(type, id, namespace) DO UPDATE SET
             attributes = excluded.attributes,
             "references" = excluded."references",
             version = saved_objects.version + 1,
             updated_at = excluded.updated_at,
             migration_version = excluded.migration_version,
             origin_id = excluded.origin_id,
             workspaces = excluded.workspaces,
             permissions = excluded.permissions`
        )
        .run(
          type,
          id,
          namespace,
          JSON.stringify(migrated.attributes),
          refs,
          now,
          migVer,
          options.originId || null,
          ws,
          perms
        );

      // Read back the actual version
      const row = this.db
        .prepare('SELECT version FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?')
        .get(type, id, namespace) as { version: number };

      return this.rowToSavedObject({
        type,
        id,
        namespace,
        attributes: JSON.stringify(migrated.attributes),
        references: refs,
        version: row.version,
        updated_at: now,
        migration_version: migVer,
        origin_id: options.originId || null,
        workspaces: ws,
        permissions: perms,
      }) as SavedObject<T>;
    }

    this.db
      .prepare(
        `INSERT INTO saved_objects
       (type, id, namespace, attributes, "references", version, updated_at, migration_version, origin_id, workspaces, permissions)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`
      )
      .run(
        type,
        id,
        namespace,
        JSON.stringify(migrated.attributes),
        refs,
        now,
        migVer,
        options.originId || null,
        ws,
        perms
      );

    return this.rowToSavedObject({
      type,
      id,
      namespace,
      attributes: JSON.stringify(migrated.attributes),
      references: refs,
      version: 1,
      updated_at: now,
      migration_version: migVer,
      origin_id: options.originId || null,
      workspaces: ws,
      permissions: perms,
    }) as SavedObject<T>;
  }

  async bulkCreate<T = unknown>(
    objects: Array<SavedObjectsBulkCreateObject<T>>,
    options: SavedObjectsCreateOptions = {}
  ): Promise<SavedObjectsBulkResponse<T>> {
    const results: Array<SavedObject<T>> = [];
    const txn = this.db.transaction(() => {
      for (const obj of objects) {
        try {
          const id = obj.id || uuid.v4();
          const namespace = options.namespace || '';
          const now = new Date().toISOString();

          if (!options.overwrite) {
            const existing = this.db
              .prepare('SELECT 1 FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?')
              .get(obj.type, id, namespace);
            if (existing) {
              results.push({
                id,
                type: obj.type,
                attributes: obj.attributes,
                references: obj.references || [],
                error: SavedObjectsErrorHelpers.createConflictError(obj.type, id).output
                  .payload as any,
              });
              continue;
            }
          }

          const migrated = this._migrator.migrateDocument({
            id,
            type: obj.type,
            attributes: obj.attributes,
            migrationVersion: obj.migrationVersion,
            ...(namespace && { namespace }),
            references: obj.references || [],
            updated_at: now,
          });

          let version = 1;
          const refs = JSON.stringify(migrated.references || []);
          const migVer = migrated.migrationVersion
            ? JSON.stringify(migrated.migrationVersion)
            : null;
          const ws = obj.workspaces ? JSON.stringify(obj.workspaces) : null;

          if (options.overwrite) {
            this.db
              .prepare(
                `INSERT INTO saved_objects
                 (type, id, namespace, attributes, "references", version, updated_at, migration_version, origin_id, workspaces, permissions)
                 VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
                 ON CONFLICT(type, id, namespace) DO UPDATE SET
                   attributes = excluded.attributes,
                   "references" = excluded."references",
                   version = saved_objects.version + 1,
                   updated_at = excluded.updated_at,
                   migration_version = excluded.migration_version,
                   origin_id = excluded.origin_id,
                   workspaces = excluded.workspaces,
                   permissions = excluded.permissions`
              )
              .run(
                obj.type,
                id,
                namespace,
                JSON.stringify(migrated.attributes),
                refs,
                now,
                migVer,
                obj.originId || null,
                ws,
                null
              );
            const row = this.db
              .prepare(
                'SELECT version FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?'
              )
              .get(obj.type, id, namespace) as { version: number };
            version = row.version;
          } else {
            this.db
              .prepare(
                `INSERT INTO saved_objects
                 (type, id, namespace, attributes, "references", version, updated_at, migration_version, origin_id, workspaces, permissions)
                 VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`
              )
              .run(
                obj.type,
                id,
                namespace,
                JSON.stringify(migrated.attributes),
                refs,
                now,
                migVer,
                obj.originId || null,
                ws,
                null
              );
          }

          results.push(
            this.rowToSavedObject({
              type: obj.type,
              id,
              namespace,
              attributes: JSON.stringify(migrated.attributes),
              references: refs,
              version,
              updated_at: now,
              migration_version: migVer,
              origin_id: obj.originId || null,
              workspaces: ws,
              permissions: null,
            }) as SavedObject<T>
          );
        } catch (err) {
          const e = err as any;
          results.push({
            id: obj.id || '',
            type: obj.type,
            attributes: obj.attributes,
            references: obj.references || [],
            error: {
              error: e.constructor?.name || 'Error',
              message: e.message,
              statusCode: e.output?.statusCode || 500,
            },
          });
        }
      }
    });
    txn();
    return { saved_objects: results };
  }

  async checkConflicts(
    objects: SavedObjectsCheckConflictsObject[] = [],
    options: SavedObjectsBaseOptions = {}
  ): Promise<SavedObjectsCheckConflictsResponse> {
    const errors: SavedObjectsCheckConflictsResponse['errors'] = [];
    const namespace = options.namespace || '';
    const stmt = this.db.prepare(
      'SELECT 1 FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?'
    );
    for (const obj of objects) {
      if (stmt.get(obj.type, obj.id, namespace)) {
        errors.push({
          id: obj.id,
          type: obj.type,
          error: SavedObjectsErrorHelpers.createConflictError(obj.type, obj.id).output.payload,
        });
      }
    }
    return { errors };
  }

  async delete(type: string, id: string, options: SavedObjectsDeleteOptions = {}): Promise<{}> {
    const namespace = options.namespace || '';
    const result = this.db
      .prepare('DELETE FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?')
      .run(type, id, namespace);
    if (result.changes === 0) {
      throw SavedObjectsErrorHelpers.createGenericNotFoundError(type, id);
    }
    return {};
  }

  async deleteByNamespace(
    namespace: string,
    options: SavedObjectsDeleteByNamespaceOptions = {}
  ): Promise<any> {
    const typesToDelete = this._allowedTypes.filter((t) => !this._registry.isNamespaceAgnostic(t));
    if (typesToDelete.length > 0) {
      const placeholders = typesToDelete.map(() => '?').join(', ');
      this.db
        .prepare(`DELETE FROM saved_objects WHERE namespace = ? AND type IN (${placeholders})`)
        .run(namespace, ...typesToDelete);
    } else {
      // No type registry — delete all objects in namespace
      this.db.prepare(`DELETE FROM saved_objects WHERE namespace = ?`).run(namespace);
    }
    return {};
  }

  async deleteByWorkspace(
    workspace: string,
    options: SavedObjectsDeleteByWorkspaceOptions = {}
  ): Promise<any> {
    this.db
      .prepare(`DELETE FROM saved_objects WHERE workspaces LIKE ?`)
      .run(`%${JSON.stringify(workspace)}%`);
    return {};
  }

  async find<T = unknown>(options: SavedObjectsFindOptions): Promise<SavedObjectsFindResponse<T>> {
    const types = Array.isArray(options.type) ? options.type : [options.type];
    const isAllTypes = types.length === 1 && types[0] === '*';
    const page = options.page || 1;
    const perPage = options.perPage || 20;
    const offset = (page - 1) * perPage;
    const namespace = options.namespaces?.[0] || '';
    if (options.namespaces && options.namespaces.length > 1) {
      this._logger?.warn(
        `find() only supports a single namespace. Using "${namespace}", ignoring ${
          options.namespaces.length - 1
        } additional namespace(s).`
      );
    }

    const params: unknown[] = [];
    let whereClause = 'namespace = ?';
    params.push(namespace);

    if (!isAllTypes) {
      const placeholders = types.map(() => '?').join(', ');
      whereClause += ` AND type IN (${placeholders})`;
      params.push(...types);
    }

    if (options.search) {
      whereClause += ` AND attributes LIKE ?`;
      params.push(`%${options.search.replace(/\*/g, '')}%`);
    }

    if (options.hasReference) {
      const ref = options.hasReference;
      whereClause += ` AND "references" LIKE ? AND "references" LIKE ?`;
      params.push(`%"type":${JSON.stringify(ref.type)}%`);
      params.push(`%"id":${JSON.stringify(ref.id)}%`);
    }

    if (options.workspaces && options.workspaces.length > 0) {
      const wsClauses = options.workspaces.map(() => `workspaces LIKE ?`).join(' OR ');
      whereClause += ` AND (${wsClauses})`;
      for (const ws of options.workspaces) {
        params.push(`%${JSON.stringify(ws)}%`);
      }
    }

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM saved_objects WHERE ${whereClause}`)
      .get(...params) as { cnt: number };

    let orderClause = 'updated_at DESC';
    if (options.sortField) {
      const dir = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
      const allowedSortFields = ['type', 'id', 'updated_at', 'version'];
      if (allowedSortFields.includes(options.sortField)) {
        orderClause = `${options.sortField} ${dir}`;
      }
    }

    const rows = this.db
      .prepare(
        `SELECT * FROM saved_objects WHERE ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`
      )
      .all(...params, perPage, offset) as RawRow[];

    return {
      saved_objects: rows.map((r) => {
        const obj = this.rowToSavedObject(r);
        return this._migrator.migrateDocument(obj) as SavedObjectsFindResult<T>;
      }),
      total: countRow.cnt,
      page,
      per_page: perPage,
    };
  }

  async bulkGet<T = unknown>(
    objects: SavedObjectsBulkGetObject[] = [],
    options: SavedObjectsBaseOptions = {}
  ): Promise<SavedObjectsBulkResponse<T>> {
    const namespace = options.namespace || '';
    const stmt = this.db.prepare(
      'SELECT * FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?'
    );
    const results: Array<SavedObject<T>> = [];

    for (const obj of objects) {
      const row = stmt.get(obj.type, obj.id, namespace) as RawRow | undefined;
      if (row) {
        const so = this.rowToSavedObject(row);
        results.push(this._migrator.migrateDocument(so) as SavedObject<T>);
      } else {
        results.push({
          id: obj.id,
          type: obj.type,
          attributes: {} as any,
          references: [],
          error: {
            error: 'Not Found',
            message: `Saved object [${obj.type}/${obj.id}] not found`,
            statusCode: 404,
          },
        });
      }
    }
    return { saved_objects: results };
  }

  async get<T = unknown>(
    type: string,
    id: string,
    options: SavedObjectsBaseOptions = {}
  ): Promise<SavedObject<T>> {
    const namespace = options.namespace || '';
    const row = this.db
      .prepare('SELECT * FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?')
      .get(type, id, namespace) as RawRow | undefined;

    if (!row) {
      throw SavedObjectsErrorHelpers.createGenericNotFoundError(type, id);
    }
    const so = this.rowToSavedObject(row);
    return this._migrator.migrateDocument(so) as SavedObject<T>;
  }

  async update<T = unknown>(
    type: string,
    id: string,
    attributes: Partial<T>,
    options: SavedObjectsUpdateOptions = {}
  ): Promise<SavedObjectsUpdateResponse<T>> {
    const namespace = options.namespace || '';
    const now = new Date().toISOString();

    const existing = this.db
      .prepare('SELECT * FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?')
      .get(type, id, namespace) as RawRow | undefined;

    if (!existing) {
      throw SavedObjectsErrorHelpers.createGenericNotFoundError(type, id);
    }

    if (options.version && String(existing.version) !== options.version) {
      throw SavedObjectsErrorHelpers.createConflictError(type, id);
    }

    const merged = { ...JSON.parse(existing.attributes), ...(attributes as any) };
    const migrated = this._migrator.migrateDocument({
      id,
      type,
      attributes: merged,
      migrationVersion: existing.migration_version
        ? JSON.parse(existing.migration_version)
        : undefined,
      references: options.references ? options.references : JSON.parse(existing.references),
      updated_at: now,
    });

    const refs = JSON.stringify(migrated.references || []);
    const migVer = migrated.migrationVersion ? JSON.stringify(migrated.migrationVersion) : null;
    const ws =
      options.workspaces !== undefined ? JSON.stringify(options.workspaces) : existing.workspaces;
    const perms =
      options.permissions !== undefined
        ? JSON.stringify(options.permissions)
        : existing.permissions;
    const newVersion = existing.version + 1;

    const result = this.db
      .prepare(
        `UPDATE saved_objects
       SET attributes = ?, "references" = ?, version = ?, updated_at = ?, migration_version = ?, workspaces = ?, permissions = ?
       WHERE type = ? AND id = ? AND namespace = ? AND version = ?`
      )
      .run(
        JSON.stringify(migrated.attributes),
        refs,
        newVersion,
        now,
        migVer,
        ws,
        perms,
        type,
        id,
        namespace,
        existing.version
      );

    if (result.changes === 0) {
      throw SavedObjectsErrorHelpers.createConflictError(type, id);
    }

    return this.rowToSavedObject({
      ...existing,
      attributes: JSON.stringify(migrated.attributes),
      references: refs,
      version: newVersion,
      updated_at: now,
      migration_version: migVer,
      workspaces: ws,
      permissions: perms,
    }) as SavedObjectsUpdateResponse<T>;
  }

  async addToNamespaces(
    type: string,
    id: string,
    namespaces: string[],
    options: SavedObjectsAddToNamespacesOptions = {}
  ): Promise<SavedObjectsAddToNamespacesResponse> {
    throw SavedObjectsErrorHelpers.createBadRequestError(
      'Multi-namespace operations are not supported by the SQLite backend'
    );
  }

  async deleteFromNamespaces(
    type: string,
    id: string,
    namespaces: string[],
    options: SavedObjectsDeleteFromNamespacesOptions = {}
  ): Promise<SavedObjectsDeleteFromNamespacesResponse> {
    throw SavedObjectsErrorHelpers.createBadRequestError(
      'Multi-namespace operations are not supported by the SQLite backend'
    );
  }

  async bulkUpdate<T = unknown>(
    objects: Array<SavedObjectsBulkUpdateObject<T>>,
    options: SavedObjectsBulkUpdateOptions = {}
  ): Promise<SavedObjectsBulkUpdateResponse<T>> {
    const results: Array<SavedObject<T>> = [];
    for (const obj of objects) {
      try {
        const updated = await this.update(obj.type, obj.id, obj.attributes as any, {
          namespace: obj.namespace || options.namespace,
          version: obj.version,
          references: obj.references,
        });
        results.push(updated as SavedObject<T>);
      } catch (err) {
        const e = err as any;
        results.push({
          id: obj.id,
          type: obj.type,
          attributes: obj.attributes as T,
          references: obj.references || [],
          error: {
            error: e.constructor?.name || 'Error',
            message: e.message,
            statusCode: e.output?.statusCode || 500,
          },
        });
      }
    }
    return { saved_objects: results };
  }

  async incrementCounter(
    type: string,
    id: string,
    counterFieldName: string,
    options: SavedObjectsIncrementCounterOptions = {}
  ): Promise<SavedObject> {
    const namespace = options.namespace || '';
    const now = new Date().toISOString();

    const existing = this.db
      .prepare('SELECT * FROM saved_objects WHERE type = ? AND id = ? AND namespace = ?')
      .get(type, id, namespace) as RawRow | undefined;

    if (existing) {
      const attrs = JSON.parse(existing.attributes);
      attrs[counterFieldName] = (attrs[counterFieldName] || 0) + 1;
      const migrated = this._migrator.migrateDocument({
        id,
        type,
        attributes: attrs,
        migrationVersion: existing.migration_version
          ? JSON.parse(existing.migration_version)
          : undefined,
        references: JSON.parse(existing.references),
        updated_at: now,
      });
      const newVersion = existing.version + 1;
      const migVer = migrated.migrationVersion ? JSON.stringify(migrated.migrationVersion) : null;
      this.db
        .prepare(
          `UPDATE saved_objects SET attributes = ?, version = ?, updated_at = ?, migration_version = ? WHERE type = ? AND id = ? AND namespace = ?`
        )
        .run(JSON.stringify(migrated.attributes), newVersion, now, migVer, type, id, namespace);
      return this.rowToSavedObject({
        ...existing,
        attributes: JSON.stringify(migrated.attributes),
        version: newVersion,
        updated_at: now,
        migration_version: migVer,
      });
    }

    // Create new object with counter = 1
    return this.create(type, { [counterFieldName]: 1 } as any, {
      id,
      namespace: namespace || undefined,
      migrationVersion: options.migrationVersion,
    });
  }

  // --- Private helpers ---

  private rowToSavedObject(row: RawRow): SavedObject {
    const obj: SavedObject = {
      type: row.type,
      id: row.id,
      attributes: JSON.parse(row.attributes),
      references: JSON.parse(row.references) as SavedObjectReference[],
      version: String(row.version),
      updated_at: row.updated_at,
    };
    if (row.namespace) {
      obj.namespaces = [row.namespace];
    }
    if (row.migration_version) {
      obj.migrationVersion = JSON.parse(row.migration_version);
    }
    if (row.origin_id) {
      obj.originId = row.origin_id;
    }
    if (row.workspaces) {
      obj.workspaces = JSON.parse(row.workspaces);
    }
    if (row.permissions) {
      obj.permissions = JSON.parse(row.permissions);
    }
    return obj;
  }
}
