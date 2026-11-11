/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { gzipSync } from 'zlib';
import { insertDataIntoIndex, isServerlessTimeSeriesIndex } from './install';

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
const serverError = { index: { status: 500, error: { type: 'exception' } } };
const genericBadRequest = {
  index: { status: 400, error: { type: 'illegal_argument_exception', reason: 'Bad Request' } },
};
const mappingError = {
  index: {
    status: 400,
    error: {
      type: 'illegal_argument_exception',
      reason: 'document is missing required timestamp field [@timestamp]',
    },
  },
};
const logger = { warn: jest.fn() } as any;

const sentMessages = (caller: jest.Mock, call: number) =>
  caller.mock.calls[call][1].body.filter((line: any) => !line.index).map((d: any) => d.message);

describe('insertDataIntoIndex', () => {
  beforeAll(() => {
    dataPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sample-data-')), 'docs.json.gz');
    fs.writeFileSync(dataPath, gzipSync(docs.map((d) => JSON.stringify(d)).join('\n')));
  });

  beforeEach(() => jest.clearAllMocks());

  it('resends only the documents rejected while the index is not ready', async () => {
    const caller = jest
      .fn()
      .mockResolvedValueOnce({ errors: true, items: [ok, notFound, serverError] })
      .mockResolvedValueOnce({ errors: true, items: [genericBadRequest, ok] })
      .mockResolvedValueOnce({ errors: false, items: [ok] });

    const count = await insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, {
      retryIndexNotFound: true,
      retryDelayMs: 0,
    });

    expect(count).toBe(3);
    expect(caller).toHaveBeenCalledTimes(3);
    expect(sentMessages(caller, 1)).toEqual(['b', 'c']);
    expect(sentMessages(caller, 2)).toEqual(['b']);
  });

  it('resends the whole batch when the bulk request itself fails with index_not_found', async () => {
    const caller = jest
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('[index_not_found_exception] no such index'), { status: 404 })
      )
      .mockResolvedValueOnce({ errors: false, items: [ok, ok, ok] });

    await insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, {
      retryIndexNotFound: true,
      retryDelayMs: 0,
    });

    expect(caller).toHaveBeenCalledTimes(2);
    expect(sentMessages(caller, 1)).toEqual(['a', 'b', 'c']);
  });

  it('does not retry other document errors', async () => {
    const caller = jest
      .fn()
      .mockResolvedValue({ errors: true, items: [ok, notFound, mappingError] });

    await expect(
      insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, {
        retryIndexNotFound: true,
        retryDelayMs: 0,
      })
    ).rejects.toThrow('Unable to load sample data into index "idx"');
    expect(caller).toHaveBeenCalledTimes(1);
  });

  it('does not retry when retries are not enabled', async () => {
    const caller = jest.fn().mockResolvedValue({ errors: true, items: [ok, notFound, ok] });

    await expect(
      insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger)
    ).rejects.toThrow('Unable to load sample data into index "idx"');
    expect(caller).toHaveBeenCalledTimes(1);
  });

  it('gives up after the maximum number of retries', async () => {
    const caller = jest.fn().mockResolvedValue({ errors: true, items: [notFound, ok, ok] });

    await expect(
      insertDataIntoIndex(dataIndexConfig(), 'idx', 'now', caller, logger, {
        retryIndexNotFound: true,
        retryDelayMs: 0,
      })
    ).rejects.toThrow('Unable to load sample data into index "idx"');
    expect(caller).toHaveBeenCalledTimes(13);
  });
});

describe('isServerlessTimeSeriesIndex', () => {
  it('is true when the index reports index.timestamp_field', async () => {
    const caller = jest
      .fn()
      .mockResolvedValue({ idx: { settings: { index: { timestamp_field: '@timestamp' } } } });
    expect(await isServerlessTimeSeriesIndex(caller, 'idx')).toBe(true);
    expect(caller).toHaveBeenCalledWith('indices.getSettings', { index: 'idx' });
  });

  it('is false for indices without index.timestamp_field', async () => {
    const caller = jest.fn().mockResolvedValue({ idx: { settings: { index: {} } } });
    expect(await isServerlessTimeSeriesIndex(caller, 'idx')).toBe(false);
  });

  it('is false when the settings cannot be read', async () => {
    const caller = jest.fn().mockRejectedValue(new Error('not supported'));
    expect(await isServerlessTimeSeriesIndex(caller, 'idx')).toBe(false);
  });
});
