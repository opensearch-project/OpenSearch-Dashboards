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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { coordinateMigration } from './migration_coordinator';
import { createSavedObjectsMigrationLoggerMock } from '../mocks';

describe('coordinateMigration', () => {
  const log = createSavedObjectsMigrationLoggerMock();

  test('waits for isMigrated, if there is an index conflict', async () => {
    const pollInterval = 1;
    const runMigration = jest.fn(() => {
      // eslint-disable-next-line no-throw-literal
      throw { body: { error: { index: '.foo', type: 'resource_already_exists_exception' } } };
    });
    const isMigrated = jest.fn();

    isMigrated.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await coordinateMigration({
      log,
      runMigration,
      pollInterval,
      isMigrated,
    });

    expect(runMigration).toHaveBeenCalledTimes(1);
    expect(isMigrated).toHaveBeenCalledTimes(2);
    const warnings = log.warning.mock.calls.filter((msg: any) => /deleting index \.foo/.test(msg));
    expect(warnings.length).toEqual(1);
  });

  test('does not poll if the runMigration succeeds', async () => {
    const pollInterval = 1;
    const runMigration = jest.fn<any, any>(() => Promise.resolve());
    const isMigrated = jest.fn(() => Promise.resolve(true));

    await coordinateMigration({
      log,
      runMigration,
      pollInterval,
      isMigrated,
    });
    expect(isMigrated).not.toHaveBeenCalled();
  });

  test('does not swallow exceptions', async () => {
    const pollInterval = 1;
    const runMigration = jest.fn(() => {
      throw new Error('Doh');
    });
    const isMigrated = jest.fn(() => Promise.resolve(true));

    await expect(
      coordinateMigration({
        log,
        runMigration,
        pollInterval,
        isMigrated,
      })
    ).rejects.toThrow(/Doh/);
    expect(isMigrated).not.toHaveBeenCalled();
  });
});

// -----------------------------------------------------------------------------
// Integrity gate tests
// -----------------------------------------------------------------------------

import {
  SavedObjectsMigrationPoisonedDestError,
  SavedObjectsMigrationPartialDestError,
  verifyDestIndexIntegrity,
} from './migration_coordinator';
import { MigrationIntegrityConfig, MigrationSentinelDoc } from './migration_reconciliation';
import { MIGRATION_SENTINEL_TYPE } from './migration_sentinel';

function makeConfig(overrides: Partial<MigrationIntegrityConfig> = {}): MigrationIntegrityConfig {
  return {
    enabled: true,
    failOnDeltaPercentPerType: 5,
    failOnAbsoluteDeltaPerType: 10,
    waitingTimeoutMs: 600000,
    ...overrides,
  };
}

function makeClientWithSentinel(sentinel: MigrationSentinelDoc | null) {
  const get = jest.fn();
  if (sentinel === null) {
    get.mockResolvedValue({ body: {}, statusCode: 404 });
  } else {
    get.mockResolvedValue({
      body: {
        _source: {
          type: MIGRATION_SENTINEL_TYPE,
          [MIGRATION_SENTINEL_TYPE]: sentinel,
        },
      },
      statusCode: 200,
    });
  }
  return {
    get,
    // Additional methods referenced inside the integrity gate if the path
    // that uses them fires. Tests that exercise the sentinel-based routes
    // won't reach these.
    indices: {
      get: jest.fn().mockResolvedValue({ body: {}, statusCode: 404 }),
    },
  };
}

describe('verifyDestIndexIntegrity', () => {
  const log = createSavedObjectsMigrationLoggerMock();

  it('sentinel status=aborted -> throws PoisonedDestError with recovery instructions', async () => {
    const sentinel: MigrationSentinelDoc = {
      status: 'aborted',
      startedAt: '2026-04-25T07:50:36Z',
      abortedAt: '2026-04-25T07:53:35Z',
      abortReason: 'failed to process cluster event (put-mapping ...) within 30s',
      nodeHostname: 'ip-10-146-153-211',
    };
    const client = makeClientWithSentinel(sentinel);
    const countByType = jest.fn(async () => new Map());
    const findPriorSource = jest.fn(async () => null);

    await expect(
      verifyDestIndexIntegrity(
        '.kibana_8',
        {
          client: client as any,
          config: makeConfig(),
          alias: '.kibana',
          countByType,
          findPriorSource,
        },
        log
      )
    ).rejects.toBeInstanceOf(SavedObjectsMigrationPoisonedDestError);

    // Verify recovery instructions are in the message
    try {
      await verifyDestIndexIntegrity(
        '.kibana_8',
        {
          client: client as any,
          config: makeConfig(),
          alias: '.kibana',
          countByType,
          findPriorSource,
        },
        log
      );
    } catch (e) {
      expect((e as Error).message).toMatch(/DELETE \.kibana_8/);
      expect((e as Error).message).toMatch(/restart OpenSearchDashboards/);
    }
  });

  it('sentinel status=complete -> returns peer-completed, does not throw', async () => {
    const sentinel: MigrationSentinelDoc = {
      status: 'complete',
      startedAt: '2026-04-25T07:50:36Z',
      nodeHostname: 'node1',
    };
    const client = makeClientWithSentinel(sentinel);

    const verdict = await verifyDestIndexIntegrity(
      '.kibana_8',
      {
        client: client as any,
        config: makeConfig(),
        alias: '.kibana',
        countByType: jest.fn(async () => new Map()),
        findPriorSource: jest.fn(async () => null),
      },
      log
    );
    expect(verdict).toBe('peer-completed');
  });

  it('sentinel status=copied -> returns peer-copied-claiming-alias', async () => {
    const sentinel: MigrationSentinelDoc = {
      status: 'copied',
      startedAt: '2026-04-25T07:50:36Z',
      nodeHostname: 'node1',
    };
    const client = makeClientWithSentinel(sentinel);

    const verdict = await verifyDestIndexIntegrity(
      '.kibana_8',
      {
        client: client as any,
        config: makeConfig(),
        alias: '.kibana',
        countByType: jest.fn(async () => new Map()),
        findPriorSource: jest.fn(async () => null),
      },
      log
    );
    expect(verdict).toBe('peer-copied-claiming-alias');
  });

  it('sentinel status=in-progress -> returns waiting-for-peer (defer to Layer C)', async () => {
    const sentinel: MigrationSentinelDoc = {
      status: 'in-progress',
      startedAt: '2026-04-25T07:50:36Z',
      nodeHostname: 'node1',
    };
    const client = makeClientWithSentinel(sentinel);

    const verdict = await verifyDestIndexIntegrity(
      '.kibana_8',
      {
        client: client as any,
        config: makeConfig(),
        alias: '.kibana',
        countByType: jest.fn(async () => new Map()),
        findPriorSource: jest.fn(async () => null),
      },
      log
    );
    expect(verdict).toBe('waiting-for-peer');
  });

  it('no sentinel + per-type count delta over threshold -> throws PartialDestError', async () => {
    const get = jest.fn().mockResolvedValue({ body: {}, statusCode: 404 });
    const client: any = { get, indices: { get: jest.fn() } };
    const countByType = jest.fn(async (indexName: string) => {
      if (indexName === '.kibana_7') {
        return new Map([['index-pattern', 82] as [string, number]]);
      }
      return new Map([['index-pattern', 9] as [string, number]]);
    });
    const findPriorSource = jest.fn(async () => '.kibana_7');

    await expect(
      verifyDestIndexIntegrity(
        '.kibana_8',
        {
          client,
          config: makeConfig(),
          alias: '.kibana',
          countByType,
          findPriorSource,
        },
        log
      )
    ).rejects.toBeInstanceOf(SavedObjectsMigrationPartialDestError);
  });

  it('no sentinel + per-type delta under threshold -> returns clean-match', async () => {
    const get = jest.fn().mockResolvedValue({ body: {}, statusCode: 404 });
    const client: any = { get, indices: { get: jest.fn() } };
    const countByType = jest.fn(async (indexName: string) => {
      if (indexName === '.kibana_7') {
        return new Map([['index-pattern', 82] as [string, number]]);
      }
      return new Map([['index-pattern', 81] as [string, number]]); // delta=1, under threshold
    });
    const findPriorSource = jest.fn(async () => '.kibana_7');

    const verdict = await verifyDestIndexIntegrity(
      '.kibana_8',
      {
        client,
        config: makeConfig(),
        alias: '.kibana',
        countByType,
        findPriorSource,
      },
      log
    );
    expect(verdict).toBe('clean-match');
  });

  it('no sentinel + no prior source -> returns waiting-for-peer (fresh cluster)', async () => {
    const get = jest.fn().mockResolvedValue({ body: {}, statusCode: 404 });
    const client: any = { get, indices: { get: jest.fn() } };
    const findPriorSource = jest.fn(async () => null);

    const verdict = await verifyDestIndexIntegrity(
      '.kibana_8',
      {
        client,
        config: makeConfig(),
        alias: '.kibana',
        countByType: jest.fn(async () => new Map()),
        findPriorSource,
      },
      log
    );
    expect(verdict).toBe('waiting-for-peer');
  });

  it('no sentinel + empty dest + peer catches up with sentinel -> re-classifies via sentinel', async () => {
    // Simulates: primary OSD called createIndex but hadn't yet written the
    // sentinel when a peer probed. After the probe delay, the primary's
    // sentinel write has landed.
    const get = jest.fn();
    get.mockResolvedValueOnce({ body: {}, statusCode: 404 }); // initial sentinel read: not there
    get.mockResolvedValueOnce({
      // retry read after race-avoidance sleep: sentinel now present
      body: {
        _source: {
          type: MIGRATION_SENTINEL_TYPE,
          [MIGRATION_SENTINEL_TYPE]: {
            status: 'in-progress',
            startedAt: 't0',
            nodeHostname: 'peer',
          },
        },
      },
      statusCode: 200,
    });
    get.mockResolvedValueOnce({
      // recursive verifyDestIndexIntegrity initial read — routes straight
      // to the in-progress waiting-for-peer verdict now that the sentinel
      // is visible.
      body: {
        _source: {
          type: MIGRATION_SENTINEL_TYPE,
          [MIGRATION_SENTINEL_TYPE]: {
            status: 'in-progress',
            startedAt: 't0',
            nodeHostname: 'peer',
          },
        },
      },
      statusCode: 200,
    });
    const client: any = { get, indices: { get: jest.fn() } };
    const countByType = jest.fn(async (indexName: string) => {
      if (indexName === '.kibana_7') {
        return new Map([['index-pattern', 82] as [string, number]]);
      }
      return new Map();
    });
    const findPriorSource = jest.fn(async () => '.kibana_7');

    const verdict = await verifyDestIndexIntegrity(
      '.kibana_8',
      {
        client,
        config: makeConfig(),
        alias: '.kibana',
        countByType,
        findPriorSource,
      },
      log
    );
    expect(verdict).toBe('waiting-for-peer');
  });

  it('no sentinel + dest still empty after probe -> throws PartialDestError', async () => {
    // createIndex happened but no peer is actually populating. After the
    // race-avoidance probe, the dest is still empty.
    const get = jest.fn().mockResolvedValue({ body: {}, statusCode: 404 });
    const client: any = { get, indices: { get: jest.fn() } };
    const countByType = jest.fn(async (indexName: string) => {
      if (indexName === '.kibana_7') {
        return new Map([['index-pattern', 82] as [string, number]]);
      }
      return new Map();
    });
    const findPriorSource = jest.fn(async () => '.kibana_7');

    await expect(
      verifyDestIndexIntegrity(
        '.kibana_8',
        {
          client,
          config: makeConfig(),
          alias: '.kibana',
          countByType,
          findPriorSource,
        },
        log
      )
    ).rejects.toBeInstanceOf(SavedObjectsMigrationPartialDestError);
  });

  it('no sentinel + dest populates during probe -> waiting-for-peer with warning', async () => {
    // Peer is populating the destination without writing a sentinel (unusual
    // but possible with a legacy / unpatched peer). Race-avoidance should
    // defer to the wait loop rather than throw.
    const get = jest.fn().mockResolvedValue({ body: {}, statusCode: 404 });
    const client: any = { get, indices: { get: jest.fn() } };
    let callCount = 0;
    const countByType = jest.fn(async (indexName: string) => {
      if (indexName === '.kibana_7') {
        return new Map([['index-pattern', 82] as [string, number]]);
      }
      // First dest read: empty. Second (after probe): has some docs.
      callCount++;
      return callCount === 1 ? new Map() : new Map([['index-pattern', 5] as [string, number]]);
    });
    const findPriorSource = jest.fn(async () => '.kibana_7');

    const verdict = await verifyDestIndexIntegrity(
      '.kibana_8',
      {
        client,
        config: makeConfig(),
        alias: '.kibana',
        countByType,
        findPriorSource,
      },
      log
    );
    expect(verdict).toBe('waiting-for-peer');
  });
});

describe('coordinateMigration with integrityVerifier', () => {
  const log = createSavedObjectsMigrationLoggerMock();

  it('integrity.enabled=false preserves legacy behavior (polls isMigrated)', async () => {
    const runMigration = jest.fn(() => {
      // eslint-disable-next-line no-throw-literal
      throw {
        body: { error: { index: '.kibana_8', type: 'resource_already_exists_exception' } },
      };
    });
    const isMigrated = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const get = jest.fn(); // should NOT be called when integrity disabled
    const client: any = { get, indices: { get: jest.fn() } };

    await coordinateMigration({
      log,
      runMigration,
      pollInterval: 1,
      isMigrated,
      integrityVerifier: {
        client,
        config: makeConfig({ enabled: false }),
        alias: '.kibana',
        countByType: jest.fn(),
        findPriorSource: jest.fn(),
      },
    });

    expect(isMigrated).toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it('propagates PoisonedDestError from the integrity gate instead of entering wait loop', async () => {
    const aborted: MigrationSentinelDoc = {
      status: 'aborted',
      startedAt: '2026-04-25T07:50:36Z',
      abortedAt: '2026-04-25T07:53:35Z',
      abortReason: 'boom',
      nodeHostname: 'n',
    };
    const runMigration = jest.fn(() => {
      // eslint-disable-next-line no-throw-literal
      throw {
        body: { error: { index: '.kibana_8', type: 'resource_already_exists_exception' } },
      };
    });
    const isMigrated = jest.fn();
    const get = jest.fn().mockResolvedValue({
      body: {
        _source: { type: MIGRATION_SENTINEL_TYPE, [MIGRATION_SENTINEL_TYPE]: aborted },
      },
      statusCode: 200,
    });
    const client: any = { get, indices: { get: jest.fn() } };

    await expect(
      coordinateMigration({
        log,
        runMigration,
        pollInterval: 1,
        isMigrated,
        integrityVerifier: {
          client,
          config: makeConfig(),
          alias: '.kibana',
          countByType: jest.fn(),
          findPriorSource: jest.fn(),
        },
      })
    ).rejects.toBeInstanceOf(SavedObjectsMigrationPoisonedDestError);

    // The wait loop never polled because we threw first.
    expect(isMigrated).not.toHaveBeenCalled();
  });
});
