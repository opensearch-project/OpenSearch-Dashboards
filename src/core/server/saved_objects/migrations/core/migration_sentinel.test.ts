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

import {
  MIGRATION_SENTINEL_ID,
  MIGRATION_SENTINEL_TYPE,
  buildInitialSentinel,
  markMigrationAborted,
  markMigrationComplete,
  markMigrationCopied,
  readMigrationSentinel,
  writeMigrationSentinel,
} from './migration_sentinel';

describe('migration_sentinel helpers', () => {
  describe('readMigrationSentinel', () => {
    it('returns null on 404', async () => {
      const client: any = {
        get: jest.fn().mockResolvedValue({ body: {}, statusCode: 404 }),
      };
      expect(await readMigrationSentinel(client, '.kibana_8')).toBeNull();
    });

    it('returns the nested sentinel payload on hit', async () => {
      const client: any = {
        get: jest.fn().mockResolvedValue({
          body: {
            _source: {
              type: MIGRATION_SENTINEL_TYPE,
              [MIGRATION_SENTINEL_TYPE]: {
                status: 'in-progress',
                startedAt: 't0',
                nodeHostname: 'host',
              },
            },
          },
          statusCode: 200,
        }),
      };
      const result = await readMigrationSentinel(client, '.kibana_8');
      expect(result?.status).toBe('in-progress');
      expect(result?.startedAt).toBe('t0');
    });

    it('returns null if payload is missing or malformed', async () => {
      const client: any = {
        get: jest.fn().mockResolvedValue({
          body: { _source: {} }, // no nested payload
          statusCode: 200,
        }),
      };
      expect(await readMigrationSentinel(client, '.kibana_8')).toBeNull();
    });
  });

  describe('writeMigrationSentinel', () => {
    it('writes with the correct id, type, and nested payload', async () => {
      const client: any = { index: jest.fn().mockResolvedValue({}) };
      const doc = buildInitialSentinel(new Date('2026-04-25T07:50:36Z'));
      await writeMigrationSentinel(client, '.kibana_8', doc);

      expect(client.index).toHaveBeenCalledWith({
        index: '.kibana_8',
        id: MIGRATION_SENTINEL_ID,
        body: {
          type: MIGRATION_SENTINEL_TYPE,
          [MIGRATION_SENTINEL_TYPE]: doc,
        },
        refresh: false,
      });
    });
  });

  describe('markMigrationAborted', () => {
    it('transitions existing in-progress sentinel to aborted with reason', async () => {
      const existing = {
        status: 'in-progress' as const,
        startedAt: '2026-04-25T07:50:36Z',
        nodeHostname: 'host',
      };
      const indexFn = jest.fn().mockResolvedValue({});
      const getFn = jest.fn().mockResolvedValue({
        body: { _source: { type: MIGRATION_SENTINEL_TYPE, [MIGRATION_SENTINEL_TYPE]: existing } },
        statusCode: 200,
      });
      const client: any = { get: getFn, index: indexFn };

      await markMigrationAborted(
        client,
        '.kibana_8',
        'failed to process cluster event',
        new Date('2026-04-25T07:53:35Z')
      );

      const written = indexFn.mock.calls[0][0].body[MIGRATION_SENTINEL_TYPE];
      expect(written.status).toBe('aborted');
      expect(written.abortReason).toBe('failed to process cluster event');
      expect(written.abortedAt).toBe(new Date('2026-04-25T07:53:35Z').toISOString());
      // previous fields preserved
      expect(written.startedAt).toBe('2026-04-25T07:50:36Z');
    });

    it('fabricates minimal sentinel if none exists (by design — abort markers must be writable)', async () => {
      const indexFn = jest.fn().mockResolvedValue({});
      const getFn = jest.fn().mockResolvedValue({ body: {}, statusCode: 404 });
      const client: any = { get: getFn, index: indexFn };

      await markMigrationAborted(client, '.kibana_8', 'boom', new Date('2026-04-25T07:53:35Z'));

      const written = indexFn.mock.calls[0][0].body[MIGRATION_SENTINEL_TYPE];
      expect(written.status).toBe('aborted');
      expect(written.abortReason).toBe('boom');
    });
  });

  describe('markMigrationCopied / markMigrationComplete', () => {
    it('copied transitions existing sentinel status', async () => {
      const existing = {
        status: 'in-progress' as const,
        startedAt: 't0',
        nodeHostname: 'host',
      };
      const indexFn = jest.fn().mockResolvedValue({});
      const client: any = {
        get: jest.fn().mockResolvedValue({
          body: { _source: { type: MIGRATION_SENTINEL_TYPE, [MIGRATION_SENTINEL_TYPE]: existing } },
          statusCode: 200,
        }),
        index: indexFn,
      };
      await markMigrationCopied(client, '.kibana_8');
      expect(indexFn.mock.calls[0][0].body[MIGRATION_SENTINEL_TYPE].status).toBe('copied');
    });

    it('complete transitions existing sentinel status', async () => {
      const existing = {
        status: 'copied' as const,
        startedAt: 't0',
        nodeHostname: 'host',
      };
      const indexFn = jest.fn().mockResolvedValue({});
      const client: any = {
        get: jest.fn().mockResolvedValue({
          body: { _source: { type: MIGRATION_SENTINEL_TYPE, [MIGRATION_SENTINEL_TYPE]: existing } },
          statusCode: 200,
        }),
        index: indexFn,
      };
      await markMigrationComplete(client, '.kibana_8');
      expect(indexFn.mock.calls[0][0].body[MIGRATION_SENTINEL_TYPE].status).toBe('complete');
    });

    it('copied throws when no sentinel exists (indicates upstream bug)', async () => {
      const client: any = {
        get: jest.fn().mockResolvedValue({ body: {}, statusCode: 404 }),
        index: jest.fn(),
      };
      await expect(markMigrationCopied(client, '.kibana_8')).rejects.toThrow(
        /no sentinel doc found/
      );
    });

    it('complete throws when no sentinel exists', async () => {
      const client: any = {
        get: jest.fn().mockResolvedValue({ body: {}, statusCode: 404 }),
        index: jest.fn(),
      };
      await expect(markMigrationComplete(client, '.kibana_8')).rejects.toThrow(
        /no sentinel doc found/
      );
    });
  });

  describe('buildInitialSentinel', () => {
    it('builds an in-progress sentinel with the provided timestamp', () => {
      const now = new Date('2026-04-25T07:50:36Z');
      const s = buildInitialSentinel(now);
      expect(s.status).toBe('in-progress');
      expect(s.startedAt).toBe(now.toISOString());
      expect(typeof s.nodeHostname).toBe('string');
    });
  });

  describe('forward-compat wire shape', () => {
    // If a destination carrying a sentinel is later read by an older OSD
    // version (e.g., after an AMI rollback), the older code path runs the
    // document through its scroll-copy / document-migrator pipeline. The
    // shape below matches the convention the pre-patch `SavedObjectsSerializer`
    // recognizes (_id = `<type>:<id>` + _source[type] populated), so the
    // document is treated as an unknown-type saved object and passed through
    // unchanged rather than logged as corrupt.
    it('uses an id prefixed with the sentinel type', () => {
      expect(MIGRATION_SENTINEL_ID.startsWith(`${MIGRATION_SENTINEL_TYPE}:`)).toBe(true);
    });

    it('the written doc satisfies the raw-saved-object shape', async () => {
      const client: any = { index: jest.fn().mockResolvedValue({}) };
      const doc = buildInitialSentinel(new Date('2026-04-25T07:50:36Z'));
      await writeMigrationSentinel(client, '.kibana_8', doc);

      // Rebuild what pre-patch SavedObjectsSerializer.isRawSavedObject checks:
      //   _id.startsWith(`${type}:`) && _source.hasOwnProperty(type)
      const call = client.index.mock.calls[0][0];
      const rawDoc = { _id: call.id, _source: call.body };
      const type = rawDoc._source.type;
      expect(type).toBe(MIGRATION_SENTINEL_TYPE);
      expect(rawDoc._id.startsWith(`${type}:`)).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(rawDoc._source, type)).toBe(true);
    });
  });
});
