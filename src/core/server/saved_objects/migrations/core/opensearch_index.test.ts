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

import type { opensearchtypes } from '@opensearch-project/opensearch';
import _ from 'lodash';
import { opensearchClientMock } from '../../../opensearch/client/mocks';
import * as Index from './opensearch_index';

describe('OpenSearchIndex', () => {
  let client: ReturnType<typeof opensearchClientMock.createOpenSearchClient>;

  beforeEach(() => {
    client = opensearchClientMock.createOpenSearchClient();
  });
  describe('fetchInfo', () => {
    test('it handles 404', async () => {
      client.indices.get.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({}, { statusCode: 404 })
      );

      // @ts-expect-error TS2345 TODO Fix me
      const info = await Index.fetchInfo(client, '.opensearch_dashboards_test');
      expect(info).toEqual({
        aliases: {},
        exists: false,
        indexName: '.opensearch_dashboards_test',
        mappings: { dynamic: 'strict', properties: {} },
      });

      expect(client.indices.get).toHaveBeenCalledWith(
        { index: '.opensearch_dashboards_test' },
        { ignore: [404] }
      );
    });

    test('fails if the index doc type is unsupported', async () => {
      // @ts-expect-error TS2345 TODO Fix me
      client.indices.get.mockImplementation((params) => {
        const index = params!.index as string;
        return opensearchClientMock.createSuccessTransportRequestPromise({
          [index]: {
            aliases: { foo: index },
            // @ts-expect-error pass unsupported mappings 'spock' for test purpose
            mappings: { spock: { dynamic: 'strict', properties: { a: 'b' } as any } },
            settings: {},
          },
        } as opensearchtypes.IndicesGetResponse);
      });

      // @ts-expect-error TS2345 TODO Fix me
      await expect(Index.fetchInfo(client, '.baz')).rejects.toThrow(
        /cannot be automatically migrated/
      );
    });

    test('fails if there are multiple root types', async () => {
      // @ts-expect-error TS2345 TODO Fix me
      client.indices.get.mockImplementation((params) => {
        const index = params!.index as string;
        return opensearchClientMock.createSuccessTransportRequestPromise({
          [index]: {
            aliases: { foo: index },
            mappings: {
              // @ts-expect-error pass multiple root types 'doc' and 'doctor' for test purpose
              doc: { dynamic: 'strict', properties: { a: 'b' } as any },
              doctor: { dynamic: 'strict', properties: { a: 'b' } as any },
            },
            settings: {},
          },
        } as opensearchtypes.IndicesGetResponse);
      });

      // @ts-expect-error TS2345 TODO Fix me
      await expect(Index.fetchInfo(client, '.baz')).rejects.toThrow(
        /cannot be automatically migrated/
      );
    });

    test('decorates index info with exists and indexName', async () => {
      // @ts-expect-error TS2345 TODO Fix me
      client.indices.get.mockImplementation((params) => {
        const index = params!.index as string;
        return opensearchClientMock.createSuccessTransportRequestPromise({
          [index]: {
            aliases: { foo: index },
            mappings: { dynamic: 'strict', properties: { a: 'b' } as any },
            settings: {},
          },
        } as opensearchtypes.IndicesGetResponse);
      });

      // @ts-expect-error TS2345 TODO Fix me
      const info = await Index.fetchInfo(client, '.baz');
      expect(info).toEqual({
        aliases: { foo: '.baz' },
        mappings: { dynamic: 'strict', properties: { a: 'b' } },
        exists: true,
        indexName: '.baz',
        settings: {},
      });
    });
  });

  describe('createIndex', () => {
    test('calls indices.create', async () => {
      // @ts-expect-error TS2345 TODO Fix me
      await Index.createIndex(client, '.abcd', { foo: 'bar' } as any);

      expect(client.indices.create).toHaveBeenCalledTimes(1);
      expect(client.indices.create).toHaveBeenCalledWith({
        body: {
          mappings: { foo: 'bar' },
          settings: {
            auto_expand_replicas: '0-1',
            number_of_shards: 1,
          },
        },
        index: '.abcd',
      });
    });
  });

  describe('deleteIndex', () => {
    test('calls indices.delete', async () => {
      // @ts-expect-error TS2345 TODO Fix me
      await Index.deleteIndex(client, '.lotr');

      expect(client.indices.delete).toHaveBeenCalledTimes(1);
      expect(client.indices.delete).toHaveBeenCalledWith({
        index: '.lotr',
      });
    });
  });

  describe('claimAlias', () => {
    test('handles unaliased indices', async () => {
      client.indices.getAlias.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({}, { statusCode: 404 })
      );

      // @ts-expect-error TS2345 TODO Fix me
      await Index.claimAlias(client, '.hola-42', '.hola');

      expect(client.indices.getAlias).toHaveBeenCalledWith(
        {
          name: '.hola',
        },
        { ignore: [404] }
      );
      expect(client.indices.updateAliases).toHaveBeenCalledWith({
        body: {
          actions: [{ add: { index: '.hola-42', alias: '.hola' } }],
        },
      });
      expect(client.indices.refresh).toHaveBeenCalledWith({
        index: '.hola-42',
      });
    });

    test('removes existing alias', async () => {
      client.indices.getAlias.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          '.my-fanci-index': { aliases: { '.muchacha': {} } },
        })
      );

      // @ts-expect-error TS2345 TODO Fix me
      await Index.claimAlias(client, '.ze-index', '.muchacha');

      expect(client.indices.getAlias).toHaveBeenCalledTimes(1);
      expect(client.indices.updateAliases).toHaveBeenCalledWith({
        body: {
          actions: [
            { remove: { index: '.my-fanci-index', alias: '.muchacha' } },
            { add: { index: '.ze-index', alias: '.muchacha' } },
          ],
        },
      });
      expect(client.indices.refresh).toHaveBeenCalledWith({
        index: '.ze-index',
      });
    });

    test('allows custom alias actions', async () => {
      client.indices.getAlias.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          '.my-fanci-index': { aliases: { '.muchacha': {} } },
        })
      );

      // @ts-expect-error TS2345 TODO Fix me
      await Index.claimAlias(client, '.ze-index', '.muchacha', [
        { remove_index: { index: 'awww-snap!' } },
      ]);

      expect(client.indices.getAlias).toHaveBeenCalledTimes(1);
      expect(client.indices.updateAliases).toHaveBeenCalledWith({
        body: {
          actions: [
            { remove_index: { index: 'awww-snap!' } },
            { remove: { index: '.my-fanci-index', alias: '.muchacha' } },
            { add: { index: '.ze-index', alias: '.muchacha' } },
          ],
        },
      });
      expect(client.indices.refresh).toHaveBeenCalledWith({
        index: '.ze-index',
      });
    });
  });

  describe('convertToAlias', () => {
    test('it creates the destination index, then reindexes to it', async () => {
      client.indices.getAlias.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          '.my-fanci-index': { aliases: { '.muchacha': {} } },
        })
      );
      client.reindex.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          task: 'abc',
        } as opensearchtypes.ReindexResponse)
      );
      client.tasks.get.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          completed: true,
        } as opensearchtypes.TaskGetResponse)
      );

      const info = {
        aliases: {},
        exists: true,
        indexName: '.ze-index',
        mappings: {
          dynamic: 'strict' as const,
          properties: { foo: { type: 'keyword' } },
        },
      } as const;

      await Index.convertToAlias(
        // @ts-expect-error TS2345 TODO Fix me
        client,
        info,
        '.muchacha',
        10,
        `ctx._id = ctx._source.type + ':' + ctx._id`
      );

      expect(client.indices.create).toHaveBeenCalledWith({
        body: {
          mappings: {
            dynamic: 'strict',
            properties: { foo: { type: 'keyword' } },
          },
          settings: { auto_expand_replicas: '0-1', number_of_shards: 1 },
        },
        index: '.ze-index',
      });

      expect(client.reindex).toHaveBeenCalledWith({
        body: {
          dest: { index: '.ze-index' },
          source: { index: '.muchacha', size: 10 },
          script: {
            source: `ctx._id = ctx._source.type + ':' + ctx._id`,
            lang: 'painless',
          },
        },
        refresh: true,
        wait_for_completion: false,
      });

      expect(client.tasks.get).toHaveBeenCalledWith({
        task_id: 'abc',
      });

      expect(client.indices.updateAliases).toHaveBeenCalledWith({
        body: {
          actions: [
            { remove_index: { index: '.muchacha' } },
            { remove: { alias: '.muchacha', index: '.my-fanci-index' } },
            { add: { index: '.ze-index', alias: '.muchacha' } },
          ],
        },
      });

      expect(client.indices.refresh).toHaveBeenCalledWith({
        index: '.ze-index',
      });
    });

    test('throws error if re-index task fails', async () => {
      client.indices.getAlias.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          '.my-fanci-index': { aliases: { '.muchacha': {} } },
        })
      );
      client.reindex.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          task: 'abc',
        } as opensearchtypes.ReindexResponse)
      );
      client.tasks.get.mockResolvedValue(
        // @ts-expect-error @opensearch-project/opensearch GetTaskResponse requires a `task` property even on errors
        opensearchClientMock.createSuccessTransportRequestPromise({
          completed: true,
          error: {
            type: 'search_phase_execution_exception',
            reason: 'all shards failed',
            failed_shards: [],
          },
        } as opensearchtypes.TaskGetResponse)
      );

      const info = {
        aliases: {},
        exists: true,
        indexName: '.ze-index',
        mappings: {
          dynamic: 'strict',
          properties: { foo: { type: 'keyword' } },
        },
      };

      // @ts-expect-error dynamic accepts boolean | "strict" | undefined. error is expected for test purpose.
      await expect(Index.convertToAlias(client, info, '.muchacha', 10)).rejects.toThrow(
        /Re-index failed \[search_phase_execution_exception\] all shards failed/
      );

      expect(client.indices.create).toHaveBeenCalledWith({
        body: {
          mappings: {
            dynamic: 'strict',
            properties: { foo: { type: 'keyword' } },
          },
          settings: { auto_expand_replicas: '0-1', number_of_shards: 1 },
        },
        index: '.ze-index',
      });

      expect(client.reindex).toHaveBeenCalledWith({
        body: {
          dest: { index: '.ze-index' },
          source: { index: '.muchacha', size: 10 },
        },
        refresh: true,
        wait_for_completion: false,
      });

      expect(client.tasks.get).toHaveBeenCalledWith({
        task_id: 'abc',
      });
    });
  });

  describe('write', () => {
    test('writes documents in bulk to the index', async () => {
      client.bulk.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          items: [] as any[],
        } as opensearchtypes.BulkResponse)
      );

      const index = '.myalias';
      const docs = [
        {
          _id: 'niceguy:fredrogers',
          _source: {
            type: 'niceguy',
            niceguy: {
              aka: 'Mr Rogers',
            },
            quotes: ['The greatest gift you ever give is your honest self.'],
          },
        },
        {
          _id: 'badguy:rickygervais',
          _source: {
            type: 'badguy',
            badguy: {
              aka: 'Dominic Badguy',
            },
            migrationVersion: { badguy: '2.3.4' },
          },
        },
      ];

      // @ts-expect-error TS2345 TODO Fix me
      await Index.write(client, index, docs);

      expect(client.bulk).toHaveBeenCalled();
      expect(client.bulk.mock.calls[0]).toMatchSnapshot();
    });

    test('fails if any document fails', async () => {
      client.bulk.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          items: [{ index: { error: { type: 'shazm', reason: 'dern' } } }],
        } as opensearchtypes.BulkResponse)
      );

      const index = '.myalias';
      const docs = [
        {
          _id: 'niceguy:fredrogers',
          _source: {
            type: 'niceguy',
            niceguy: {
              aka: 'Mr Rogers',
            },
          },
        },
      ];

      await expect(Index.write(client as any, index, docs)).rejects.toThrow(/dern/);
      expect(client.bulk).toHaveBeenCalledTimes(1);
    });

    // --- retry tests --------------------

    const ZERO_BACKOFF_RETRY = {
      enabled: true,
      maxRetries: 5,
      initialBackoffMs: 0, // tests run fast without real sleeps
      maxBackoffMs: 0,
      clusterEventTimeoutMs: 120000,
    };

    const ONE_DOC = [
      {
        _id: 'a:1',
        _source: { type: 'a', a: { v: 1 } },
      },
    ];

    test('retries a transient 503 once, succeeds on second attempt', async () => {
      client.bulk
        .mockResolvedValueOnce(
          opensearchClientMock.createSuccessTransportRequestPromise({
            items: [
              {
                index: {
                  _id: 'a:1',
                  status: 503,
                  error: { type: 'process_cluster_event_timeout_exception', reason: 'transient' },
                },
              },
            ],
          } as opensearchtypes.BulkResponse)
        )
        .mockResolvedValueOnce(
          opensearchClientMock.createSuccessTransportRequestPromise({
            items: [{ index: { _id: 'a:1', status: 201 } }],
          } as opensearchtypes.BulkResponse)
        );

      await Index.write(client as any, '.myalias', ONE_DOC, ZERO_BACKOFF_RETRY);
      expect(client.bulk).toHaveBeenCalledTimes(2);
    });

    test('exhausts retries on persistent 503 and throws with history', async () => {
      client.bulk.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          items: [
            {
              index: {
                _id: 'a:1',
                status: 503,
                error: {
                  type: 'process_cluster_event_timeout_exception',
                  reason: 'failed to process cluster event',
                },
              },
            },
          ],
        } as opensearchtypes.BulkResponse)
      );

      const cfg = { ...ZERO_BACKOFF_RETRY, maxRetries: 3 };
      await expect(Index.write(client as any, '.myalias', ONE_DOC, cfg)).rejects.toThrow(
        /failed after 4 attempt\(s\)/
      );
      // attempt 1 + 3 retries = 4 bulk calls
      expect(client.bulk).toHaveBeenCalledTimes(4);
    });

    test('retries ONLY the failed items, not the whole batch', async () => {
      client.bulk
        .mockResolvedValueOnce(
          opensearchClientMock.createSuccessTransportRequestPromise({
            items: [
              { index: { _id: 'a:1', status: 201 } },
              {
                index: {
                  _id: 'a:2',
                  status: 503,
                  error: { type: 'process_cluster_event_timeout_exception', reason: 't' },
                },
              },
              { index: { _id: 'a:3', status: 201 } },
            ],
          } as opensearchtypes.BulkResponse)
        )
        .mockResolvedValueOnce(
          opensearchClientMock.createSuccessTransportRequestPromise({
            items: [{ index: { _id: 'a:2', status: 201 } }],
          } as opensearchtypes.BulkResponse)
        );

      const docs = [
        { _id: 'a:1', _source: { type: 'a', a: { v: 1 } } },
        { _id: 'a:2', _source: { type: 'a', a: { v: 2 } } },
        { _id: 'a:3', _source: { type: 'a', a: { v: 3 } } },
      ];

      await Index.write(client as any, '.myalias', docs, ZERO_BACKOFF_RETRY);
      expect(client.bulk).toHaveBeenCalledTimes(2);
      // Second call body should have only one action/doc pair (a:2).
      const secondCallBody = client.bulk.mock.calls[1][0]!.body as object[];
      expect(secondCallBody).toHaveLength(2);
      // First element is the action header; second is the doc. Confirm
      // the action header references a:2.
      expect(JSON.stringify(secondCallBody[0])).toContain('a:2');
    });

    test('does NOT retry non-retriable errors (400) — throws immediately', async () => {
      client.bulk.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          items: [
            {
              index: {
                _id: 'a:1',
                status: 400,
                error: { type: 'mapper_parsing_exception', reason: 'bad mapping' },
              },
            },
          ],
        } as opensearchtypes.BulkResponse)
      );

      await expect(
        Index.write(client as any, '.myalias', ONE_DOC, ZERO_BACKOFF_RETRY)
      ).rejects.toThrow(/bad mapping/);
      expect(client.bulk).toHaveBeenCalledTimes(1);
    });

    test('retry.enabled=false preserves legacy single-shot behavior', async () => {
      client.bulk.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          items: [
            {
              index: {
                _id: 'a:1',
                status: 503,
                error: { type: 'process_cluster_event_timeout_exception', reason: 't' },
              },
            },
          ],
        } as opensearchtypes.BulkResponse)
      );

      const cfg = { ...ZERO_BACKOFF_RETRY, enabled: false };
      await expect(Index.write(client as any, '.myalias', ONE_DOC, cfg)).rejects.toThrow(
        /failed after 1 attempt/
      );
      expect(client.bulk).toHaveBeenCalledTimes(1);
    });

    test('retries cluster_block_exception but caps at maxRetries', async () => {
      client.bulk.mockResolvedValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          items: [
            {
              index: {
                _id: 'a:1',
                status: 429,
                error: { type: 'cluster_block_exception', reason: 'disk watermark' },
              },
            },
          ],
        } as opensearchtypes.BulkResponse)
      );

      const cfg = { ...ZERO_BACKOFF_RETRY, maxRetries: 2 };
      await expect(Index.write(client as any, '.myalias', ONE_DOC, cfg)).rejects.toThrow();
      expect(client.bulk).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('isRetriableBulkItemError', () => {
    test('503 is retriable', () => {
      expect(
        Index.isRetriableBulkItemError({ status: 503, error: { type: 'x', reason: 'y' } })
      ).toBe(true);
    });

    test('429 is retriable', () => {
      expect(
        Index.isRetriableBulkItemError({ status: 429, error: { type: 'x', reason: 'y' } })
      ).toBe(true);
    });

    test('process_cluster_event_timeout_exception is retriable on any status', () => {
      expect(
        Index.isRetriableBulkItemError({
          status: 500,
          error: { type: 'process_cluster_event_timeout_exception', reason: 'x' },
        })
      ).toBe(true);
    });

    test('reason matching "failed to process cluster event" is retriable', () => {
      expect(
        Index.isRetriableBulkItemError({
          status: 500,
          error: { type: 'other', reason: 'failed to process cluster event (put-mapping)' },
        })
      ).toBe(true);
    });

    test('400 mapper_parsing_exception is NOT retriable', () => {
      expect(
        Index.isRetriableBulkItemError({
          status: 400,
          error: { type: 'mapper_parsing_exception', reason: 'nope' },
        })
      ).toBe(false);
    });

    test('no error = not retriable', () => {
      expect(Index.isRetriableBulkItemError({ status: 200 })).toBe(false);
    });
  });

  describe('reader', () => {
    test('returns docs in batches', async () => {
      const index = '.myalias';
      const batch1 = [
        {
          _id: 'such:1',
          _source: { type: 'such', such: { num: 1 } },
        },
      ];
      const batch2 = [
        {
          _id: 'aaa:2',
          _source: { type: 'aaa', aaa: { num: 2 } },
        },
        {
          _id: 'bbb:3',
          _source: {
            bbb: { num: 3 },
            migrationVersion: { bbb: '3.2.5' },
            type: 'bbb',
          },
        },
      ];

      client.search = jest.fn().mockReturnValue(
        opensearchClientMock.createSuccessTransportRequestPromise({
          _scroll_id: 'x',
          _shards: { success: 1, total: 1 },
          hits: { hits: _.cloneDeep(batch1) },
        })
      );
      client.scroll = jest
        .fn()
        .mockReturnValueOnce(
          opensearchClientMock.createSuccessTransportRequestPromise({
            _scroll_id: 'y',
            _shards: { success: 1, total: 1 },
            hits: { hits: _.cloneDeep(batch2) },
          })
        )
        .mockReturnValueOnce(
          opensearchClientMock.createSuccessTransportRequestPromise({
            _scroll_id: 'z',
            _shards: { success: 1, total: 1 },
            hits: { hits: [] },
          })
        );

      // @ts-expect-error TS2345 TODO Fix me
      const read = Index.reader(client, index, { batchSize: 100, scrollDuration: '5m' });

      expect(await read()).toEqual(batch1);
      expect(await read()).toEqual(batch2);
      expect(await read()).toEqual([]);

      expect(client.search).toHaveBeenCalledWith({
        body: { size: 100 },
        index,
        scroll: '5m',
      });
      expect(client.scroll).toHaveBeenCalledWith({
        scroll: '5m',
        scroll_id: 'x',
      });
      expect(client.scroll).toHaveBeenCalledWith({
        scroll: '5m',
        scroll_id: 'y',
      });
      expect(client.clearScroll).toHaveBeenCalledWith({
        scroll_id: 'z',
      });
    });

    test('returns all root-level properties', async () => {
      const index = '.myalias';
      const batch = [
        {
          _id: 'such:1',
          _source: {
            acls: '3230a',
            foos: { is: 'fun' },
            such: { num: 1 },
            type: 'such',
          },
        },
      ];

      client.search = jest.fn().mockReturnValueOnce(
        opensearchClientMock.createSuccessTransportRequestPromise({
          _scroll_id: 'x',
          _shards: { success: 1, total: 1 },
          hits: { hits: _.cloneDeep(batch) },
        })
      );
      client.scroll = jest.fn().mockReturnValueOnce(
        opensearchClientMock.createSuccessTransportRequestPromise({
          _scroll_id: 'z',
          _shards: { success: 1, total: 1 },
          hits: { hits: [] },
        })
      );

      // @ts-expect-error TS2345 TODO Fix me
      const read = Index.reader(client, index, {
        batchSize: 100,
        scrollDuration: '5m',
      });

      expect(await read()).toEqual(batch);
    });

    test('fails if not all shards were successful', async () => {
      const index = '.myalias';

      client.search = jest.fn().mockReturnValueOnce(
        opensearchClientMock.createSuccessTransportRequestPromise({
          _shards: { successful: 1, total: 2 },
        })
      );

      // @ts-expect-error TS2345 TODO Fix me
      const read = Index.reader(client, index, {
        batchSize: 100,
        scrollDuration: '5m',
      });

      await expect(read()).rejects.toThrow(/shards failed/);
    });

    test('handles shards not being returned', async () => {
      const index = '.myalias';
      const batch = [
        {
          _id: 'such:1',
          _source: {
            acls: '3230a',
            foos: { is: 'fun' },
            such: { num: 1 },
            type: 'such',
          },
        },
      ];

      client.search = jest.fn().mockReturnValueOnce(
        opensearchClientMock.createSuccessTransportRequestPromise({
          _scroll_id: 'x',
          hits: { hits: _.cloneDeep(batch) },
        })
      );
      client.scroll = jest.fn().mockReturnValueOnce(
        opensearchClientMock.createSuccessTransportRequestPromise({
          _scroll_id: 'z',
          hits: { hits: [] },
        })
      );

      // @ts-expect-error TS2345 TODO Fix me
      const read = Index.reader(client, index, {
        batchSize: 100,
        scrollDuration: '5m',
      });

      expect(await read()).toEqual(batch);
    });
  });

  describe('migrationsUpToDate', () => {
    // A helper to reduce boilerplate in the hasMigration tests that follow.
    async function testMigrationsUpToDate({
      index = '.myindex',
      mappings,
      count,
      migrations,
    }: any) {
      client.indices.get = jest.fn().mockReturnValueOnce(
        opensearchClientMock.createSuccessTransportRequestPromise({
          [index]: { mappings },
        })
      );
      client.count = jest.fn().mockReturnValueOnce(
        opensearchClientMock.createSuccessTransportRequestPromise({
          count,
          _shards: { success: 1, total: 1 },
        })
      );

      // @ts-expect-error TS2345 TODO Fix me
      const hasMigrations = await Index.migrationsUpToDate(client, index, migrations);
      return { hasMigrations };
    }

    test('is false if the index mappings do not contain migrationVersion', async () => {
      const { hasMigrations } = await testMigrationsUpToDate({
        index: '.myalias',
        mappings: {
          properties: {
            dashboard: { type: 'text' },
          },
        },
        count: 0,
        migrations: { dashy: '2.3.4' },
      });

      expect(hasMigrations).toBeFalsy();
      expect(client.indices.get).toHaveBeenCalledWith(
        {
          index: '.myalias',
        },
        {
          ignore: [404],
        }
      );
    });

    test('is true if there are no migrations defined', async () => {
      const { hasMigrations } = await testMigrationsUpToDate({
        index: '.myalias',
        mappings: {
          properties: {
            migrationVersion: {
              dynamic: 'true',
              type: 'object',
            },
            dashboard: { type: 'text' },
          },
        },
        count: 2,
        migrations: {},
      });

      expect(hasMigrations).toBeTruthy();
      expect(client.indices.get).toHaveBeenCalledTimes(1);
    });

    test('is true if there are no documents out of date', async () => {
      const { hasMigrations } = await testMigrationsUpToDate({
        index: '.myalias',
        mappings: {
          properties: {
            migrationVersion: {
              dynamic: 'true',
              type: 'object',
            },
            dashboard: { type: 'text' },
          },
        },
        count: 0,
        migrations: { dashy: '23.2.5' },
      });

      expect(hasMigrations).toBeTruthy();
      expect(client.indices.get).toHaveBeenCalledTimes(1);
      expect(client.count).toHaveBeenCalledTimes(1);
    });

    test('is false if there are documents out of date', async () => {
      const { hasMigrations } = await testMigrationsUpToDate({
        index: '.myalias',
        mappings: {
          properties: {
            migrationVersion: {
              dynamic: 'true',
              type: 'object',
            },
            dashboard: { type: 'text' },
          },
        },
        count: 3,
        migrations: { dashy: '23.2.5' },
      });

      expect(hasMigrations).toBeFalsy();
      expect(client.indices.get).toHaveBeenCalledTimes(1);
      expect(client.count).toHaveBeenCalledTimes(1);
    });

    test('counts docs that are out of date', async () => {
      await testMigrationsUpToDate({
        index: '.myalias',
        mappings: {
          properties: {
            migrationVersion: {
              dynamic: 'true',
              type: 'object',
            },
            dashboard: { type: 'text' },
          },
        },
        count: 0,
        migrations: {
          dashy: '23.2.5',
          bashy: '99.9.3',
          flashy: '3.4.5',
        },
      });

      function shouldClause(type: string, version: string) {
        return {
          bool: {
            must: [
              { exists: { field: type } },
              {
                bool: {
                  must_not: { term: { [`migrationVersion.${type}`]: version } },
                },
              },
            ],
          },
        };
      }

      expect(client.count).toHaveBeenCalledWith({
        body: {
          query: {
            bool: {
              should: [
                shouldClause('dashy', '23.2.5'),
                shouldClause('bashy', '99.9.3'),
                shouldClause('flashy', '3.4.5'),
              ],
            },
          },
        },
        index: '.myalias',
      });
    });
  });
});
