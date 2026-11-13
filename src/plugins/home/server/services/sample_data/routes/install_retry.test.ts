/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { gzipSync } from 'zlib';
import { Logger } from 'src/core/server';
import { insertDataIntoIndex } from './install';

const docs = [{ message: 'a' }, { message: 'b' }, { message: 'c' }];
let dataPath: string;

const dataIndexConfig = () => ({
  dataPath,
  timeFields: [],
  currentTimeMarker: '2024-01-01T00:00:00',
  preserveDayOfWeekTimeOfDay: false,
});

const ok = { index: { status: 201 } };
const notFound = { index: { status: 404, error: { type: 'index_not_found_exception' } } };
const badRequest = {
  index: { status: 400, error: { type: 'illegal_argument_exception', reason: 'Bad Request' } },
};
const serverError = { index: { status: 503, error: { type: 'exception' } } };
const documentError = {
  index: {
    status: 400,
    error: {
      type: 'illegal_argument_exception',
      reason: 'document is missing required timestamp field [@timestamp]',
    },
  },
};
const logger = { warn: jest.fn() } as unknown as Logger;
const retry = { retryNotReady: true, retryDelayMs: 0 };

const sentMessages = (caller: jest.Mock, call: number): string[] =>
  caller.mock.calls[call][1].body
    .filter((line: { index?: unknown }) => !line.index)
    .map((doc: { message: string }) => doc.message);

describe('insertDataIntoIndex', () => {
  beforeAll(() => {
    dataPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sample-data-')), 'docs.json.gz');
    fs.writeFileSync(dataPath, gzipSync(docs.map((doc) => JSON.stringify(doc)).join('\n')));
  });

  beforeEach(() => jest.clearAllMocks());

  it('resends only the documents rejected while the index was not ready', async () => {
    const caller = jest
      .fn()
      .mockResolvedValueOnce({ errors: true, items: [ok, notFound, badRequest] })
      .mockResolvedValueOnce({ errors: true, items: [badRequest, ok] })
      .mockResolvedValueOnce({ errors: false, items: [ok] });

    const count = await insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, retry);

    expect(count).toBe(3);
    expect(caller).toHaveBeenCalledTimes(3);
    expect(sentMessages(caller, 1)).toEqual(['b', 'c']);
    expect(sentMessages(caller, 2)).toEqual(['b']);
  });

  it('resends the whole batch when the bulk request fails with index_not_found', async () => {
    const caller = jest
      .fn()
      .mockRejectedValueOnce(new Error('[index_not_found_exception] no such index'))
      .mockResolvedValueOnce({ errors: false, items: [ok, ok, ok] });

    await insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, retry);

    expect(caller).toHaveBeenCalledTimes(2);
    expect(sentMessages(caller, 1)).toEqual(['a', 'b', 'c']);
  });

  it.each([
    ['document errors', documentError],
    ['server errors, which may have been written', serverError],
  ])('does not resend %s', async (_, rejection) => {
    const caller = jest.fn().mockResolvedValue({ errors: true, items: [ok, notFound, rejection] });

    await expect(
      insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, retry)
    ).rejects.toThrow('Unable to load sample data into index "idx"');
    expect(caller).toHaveBeenCalledTimes(1);
  });

  it('does not resend when retries are not enabled', async () => {
    const caller = jest.fn().mockResolvedValue({ errors: true, items: [ok, notFound, ok] });

    await expect(
      insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger)
    ).rejects.toThrow('Unable to load sample data into index "idx"');
    expect(caller).toHaveBeenCalledTimes(1);
  });

  it('stops resending once the deadline for the index has passed', async () => {
    const caller = jest.fn().mockResolvedValue({ errors: true, items: [notFound, ok, ok] });

    await expect(
      insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, {
        retryNotReady: true,
        retryDelayMs: 5,
        retryTimeoutMs: 30,
      })
    ).rejects.toThrow('Unable to load sample data into index "idx"');
    expect(caller.mock.calls.length).toBeGreaterThan(1);
    expect(caller.mock.calls.length).toBeLessThan(20);
  });
});
