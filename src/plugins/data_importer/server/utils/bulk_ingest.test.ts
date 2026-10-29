/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { opensearchServiceMock } from '../../../../core/server/mocks';
import {
  BulkIngester,
  MAX_ERROR_SUMMARY_TYPES,
  normalizeErrorReason,
  summarizeFailures,
} from './bulk_ingest';
import { BulkIndexForbiddenError } from './util';

type BulkItem = Record<string, { status: number; error?: { type: string; reason: string } }>;

const ok = (): BulkItem => ({ index: { status: 201 } });
const fail = (type: string, reason: string, status = 400): BulkItem => ({
  index: { status, error: { type, reason } },
});

/**
 * Mirrors the verified live `_bulk` contract: HTTP 200 even on partial failure, top-level
 * `errors` flag, per-item `<op>.status` and `<op>.error.{type,reason}`.
 */
const bulkResponse = (items: BulkItem[]) =>
  opensearchServiceMock.createApiResponse({
    statusCode: 200,
    body: { took: 1, errors: items.some((i) => !!i.index.error), items },
  });

describe('normalizeErrorReason()', () => {
  it('strips per-document ids and value previews so identical causes bucket together', () => {
    const a = normalizeErrorReason(
      "failed to parse field [age] of type [integer] in document with id 'abc123'. Preview of field's value: 'old'"
    );
    const b = normalizeErrorReason(
      "failed to parse field [age] of type [integer] in document with id 'zzz999'. Preview of field's value: 'ancient'"
    );
    expect(a).toBe('failed to parse field [age] of type [integer]');
    expect(b).toBe(a);
  });

  it('leaves reasons without per-document detail untouched', () => {
    expect(normalizeErrorReason('index [foo] blocked by: [FORBIDDEN/8/index write (api)];')).toBe(
      'index [foo] blocked by: [FORBIDDEN/8/index write (api)];'
    );
  });
});

describe('summarizeFailures()', () => {
  it('buckets by type + normalized reason, sorts by count desc, and caps at top N', () => {
    const failures = [
      ...Array.from({ length: 10 }, (_, i) => ({
        row: i + 1,
        type: 'mapper_parsing_exception',
        reason: 'failed to parse field [age] of type [integer]',
      })),
      { row: 11, type: 'illegal_argument_exception', reason: 'bad thing' },
      { row: 12, type: 'illegal_argument_exception', reason: 'bad thing' },
      ...Array.from({ length: MAX_ERROR_SUMMARY_TYPES + 2 }, (_, i) => ({
        row: 100 + i,
        type: `rare_${i}`,
        reason: 'once',
      })),
    ];

    const summary = summarizeFailures(failures);

    expect(summary).toHaveLength(MAX_ERROR_SUMMARY_TYPES);
    expect(summary[0]).toEqual({
      type: 'mapper_parsing_exception',
      reason: 'failed to parse field [age] of type [integer]',
      count: 10,
      sampleRows: [1, 2, 3, 4, 5],
    });
    expect(summary[1]).toMatchObject({ type: 'illegal_argument_exception', count: 2 });
    expect(summary[1].sampleRows).toEqual([11, 12]);
  });

  it('keeps same type with different reasons as separate buckets', () => {
    const summary = summarizeFailures([
      { row: 1, type: 'mapper_parsing_exception', reason: 'failed to parse field [a]' },
      { row: 2, type: 'mapper_parsing_exception', reason: 'failed to parse field [b]' },
      { row: 3, type: 'mapper_parsing_exception', reason: 'failed to parse field [a]' },
    ]);
    expect(summary).toEqual([
      expect.objectContaining({ reason: 'failed to parse field [a]', count: 2 }),
      expect.objectContaining({ reason: 'failed to parse field [b]', count: 1 }),
    ]);
  });

  it('returns an empty summary when nothing failed', () => {
    expect(summarizeFailures([])).toEqual([]);
  });
});

describe('BulkIngester', () => {
  let client: ReturnType<typeof opensearchServiceMock.createOpenSearchClient>;

  beforeEach(() => {
    client = opensearchServiceMock.createOpenSearchClient();
  });

  it('sends documents as chunked _bulk index actions against the target index', async () => {
    client.bulk.mockImplementation(((params: { body: unknown[] }) =>
      Promise.resolve(
        bulkResponse(Array.from({ length: params.body.length / 2 }, ok))
      )) as unknown as typeof client.bulk);

    const ingester = new BulkIngester(client, 'foo', 2);
    for (let row = 1; row <= 5; row++) {
      await ingester.add(row, { n: row });
    }
    const result = await ingester.finish(5);

    // 5 docs at chunk size 2 => 3 bulk requests (2 + 2 + 1)
    expect(client.bulk).toHaveBeenCalledTimes(3);
    expect(client.bulk.mock.calls[0][0]).toEqual({
      body: [{ index: { _index: 'foo' } }, { n: 1 }, { index: { _index: 'foo' } }, { n: 2 }],
    });
    expect(result).toEqual({
      total: 5,
      message: 'Indexed 5 documents',
      failedRows: [],
      errorSummary: [],
    });
  });

  it('treats HTTP 200 with errors:true as a partial failure and maps items back to rows', async () => {
    client.bulk.mockResolvedValueOnce(
      bulkResponse([
        ok(),
        fail(
          'mapper_parsing_exception',
          "failed to parse field [age] of type [integer] in document with id 'a'. Preview of field's value: 'x'"
        ),
        fail(
          'mapper_parsing_exception',
          "failed to parse field [age] of type [integer] in document with id 'b'. Preview of field's value: 'y'"
        ),
        ok(),
      ])
    );

    const ingester = new BulkIngester(client, 'foo', 10);
    for (let row = 1; row <= 4; row++) {
      await ingester.add(row, { age: row });
    }
    const result = await ingester.finish(4);

    expect(result.total).toBe(4);
    expect(result.message).toBe('Indexed 2 documents');
    expect(result.failedRows).toEqual([2, 3]);
    expect(result.errorSummary).toEqual([
      {
        type: 'mapper_parsing_exception',
        reason: 'failed to parse field [age] of type [integer]',
        count: 2,
        sampleRows: [2, 3],
      },
    ]);
  });

  it('surfaces a per-item 403 (HTTP 200 body) as a single BulkIndexForbiddenError', async () => {
    // The common shape (matches a live security-plugin denial): _bulk returns HTTP 200 with
    // errors:true and every item carrying status 403 + a security_exception.
    const denied = fail(
      'security_exception',
      'no permissions for [indices:data/write/bulk[s], indices:data/write/index] and User [name=broken1, backend_roles=[], requestedTenant=null]',
      403
    );
    client.bulk.mockResolvedValueOnce(bulkResponse([denied, denied, denied]));

    const ingester = new BulkIngester(client, 'foo', 10);
    for (let row = 1; row <= 3; row++) {
      await ingester.add(row, { a: row });
    }

    await expect(ingester.finish(3)).rejects.toBeInstanceOf(BulkIndexForbiddenError);
    await ingester.finish(3).catch((e) => {
      expect(e.statusCode).toBe(403);
      expect(e.message).toMatch(/do not have permission to write to index "foo"/i);
      expect(e.message).toMatch(/indices:data\/write\/bulk/);
    });
  });

  it('surfaces a wholesale 403 as a single BulkIndexForbiddenError, not N per-row failures', async () => {
    const securityError = Object.assign(new Error('Response Error'), {
      meta: {
        statusCode: 403,
        body: {
          error: {
            type: 'security_exception',
            reason: 'no permissions for [indices:data/write/bulk] and User [name=analyst1]',
          },
        },
      },
    });
    client.bulk.mockRejectedValueOnce(securityError);

    const ingester = new BulkIngester(client, 'foo', 10);
    await ingester.add(1, { a: 1 });
    await ingester.add(2, { a: 2 });

    // A missing bulk-write privilege rejects the whole request: report it once as a permission
    // error, rather than "failed to upload" with one failed-document bucket per row.
    await expect(ingester.finish(2)).rejects.toBeInstanceOf(BulkIndexForbiddenError);
    await ingester.finish(2).catch((e) => {
      expect(e.statusCode).toBe(403);
      expect(e.message).toMatch(/indices:data\/write\/bulk/);
      expect(e.message).toMatch(/do not have permission/i);
    });
  });

  it('detects a 403 reported via statusCode directly (not only under meta)', async () => {
    client.bulk.mockRejectedValueOnce(
      Object.assign(new Error('Response Error'), { statusCode: 403 })
    );

    const ingester = new BulkIngester(client, 'foo', 10);
    await ingester.add(1, { a: 1 });
    await expect(ingester.finish(1)).rejects.toBeInstanceOf(BulkIndexForbiddenError);
  });

  it('still buckets non-403 whole-request throws per row (transient/partial faults)', async () => {
    client.bulk.mockRejectedValueOnce(new Error('socket hang up'));

    const ingester = new BulkIngester(client, 'foo', 10);
    await ingester.add(1, { a: 1 });
    const result = await ingester.finish(1);

    expect(result.errorSummary).toEqual([
      { type: 'Error', reason: 'socket hang up', count: 1, sampleRows: [1] },
    ]);
  });

  it('treats a 403 appearing on a non-first chunk as fatal too', async () => {
    client.bulk
      .mockResolvedValueOnce(bulkResponse([ok(), ok()]))
      .mockRejectedValueOnce(Object.assign(new Error('denied'), { statusCode: 403 }));

    const ingester = new BulkIngester(client, 'foo', 2);
    for (let row = 1; row <= 4; row++) {
      await ingester.add(row, { a: row });
    }
    await expect(ingester.finish(4)).rejects.toBeInstanceOf(BulkIndexForbiddenError);
  });

  it('includes locally-rejected rows (never sent to OpenSearch) in failures and summary', async () => {
    const ingester = new BulkIngester(client, 'foo', 10);
    await ingester.add(1, { a: 1 });
    ingester.addFailure(2, 'invalid_row', 'Row has empty or malformed field names');
    const result = await ingester.finish(2);

    expect(client.bulk).toHaveBeenCalledTimes(1);
    expect(client.bulk.mock.calls[0][0]).toEqual({
      body: [{ index: { _index: 'foo' } }, { a: 1 }],
    });
    expect(result.failedRows).toEqual([2]);
    expect(result.errorSummary).toEqual([
      {
        type: 'invalid_row',
        reason: 'Row has empty or malformed field names',
        count: 1,
        sampleRows: [2],
      },
    ]);
  });

  it('coerces numbers/booleans to strings for fields the target mapping declares as strings', async () => {
    client.bulk.mockResolvedValue(bulkResponse([ok()]));

    const ingester = new BulkIngester(client, 'foo', 10, {
      properties: {
        zip: { type: 'keyword' },
        age: { type: 'integer' },
        host: { properties: { zone: { type: 'text' } } },
      },
    });
    await ingester.add(1, { zip: 2134, age: 30, host: { zone: 7 }, undeclared: 5 });
    await ingester.finish(1);

    expect(client.bulk.mock.calls[0][0]).toEqual({
      body: [
        { index: { _index: 'foo' } },
        // zip + host.zone stringified; numeric target and undeclared fields untouched
        { zip: '2134', age: 30, host: { zone: '7' }, undeclared: 5 },
      ],
    });
  });

  it('sends documents unchanged when no mapping is given', async () => {
    client.bulk.mockResolvedValue(bulkResponse([ok()]));

    const ingester = new BulkIngester(client, 'foo', 10);
    await ingester.add(1, { zip: 2134 });
    await ingester.finish(1);

    expect(client.bulk.mock.calls[0][0]).toEqual({
      body: [{ index: { _index: 'foo' } }, { zip: 2134 }],
    });
  });

  it('does not call _bulk at all when there are no documents', async () => {
    const ingester = new BulkIngester(client, 'foo', 10);
    const result = await ingester.finish(0);
    expect(client.bulk).not.toHaveBeenCalled();
    expect(result).toEqual({
      total: 0,
      message: 'Indexed 0 documents',
      failedRows: [],
      errorSummary: [],
    });
  });

  it('keeps at most one bulk request in flight (bounded concurrency)', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    client.bulk.mockImplementation(((params: { body: unknown[] }) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return new Promise((resolve) =>
        setTimeout(() => {
          inFlight--;
          resolve(bulkResponse(Array.from({ length: params.body.length / 2 }, ok)));
        }, 5)
      );
    }) as unknown as typeof client.bulk);

    const ingester = new BulkIngester(client, 'foo', 2);
    // Deliberately do NOT await add(), simulating a stream that keeps emitting
    for (let row = 1; row <= 10; row++) {
      ingester.add(row, { n: row });
    }
    const result = await ingester.finish(10);

    expect(client.bulk).toHaveBeenCalledTimes(5);
    expect(maxInFlight).toBe(1);
    expect(result.failedRows).toEqual([]);
  });
});
