/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isIndexNotFoundError,
  isNotReadyRejection,
  isServerlessDataSource,
  isTimeSeriesIndex,
  withTimestampAlias,
} from './serverless_time_series';

describe('isServerlessDataSource', () => {
  it('detects Serverless by engine type or by SigV4 service', () => {
    expect(isServerlessDataSource({ dataSourceEngineType: 'OpenSearch Serverless' })).toBe(true);
    expect(
      isServerlessDataSource({
        dataSourceEngineType: 'No Engine Type Available',
        auth: { credentials: { service: 'aoss' } },
      })
    ).toBe(true);
  });

  it('is false for other data sources', () => {
    expect(isServerlessDataSource({ dataSourceEngineType: 'OpenSearch' })).toBe(false);
    expect(isServerlessDataSource({ auth: { credentials: { service: 'es' } } })).toBe(false);
    expect(isServerlessDataSource(undefined)).toBe(false);
  });
});

describe('withTimestampAlias', () => {
  it('aliases @timestamp to the primary time field', () => {
    expect(withTimestampAlias({ order_date: { type: 'date' } }, ['order_date'])).toEqual({
      order_date: { type: 'date' },
      '@timestamp': { type: 'alias', path: 'order_date' },
    });
  });

  it('replaces an @timestamp mapping that no document fills', () => {
    const fields = withTimestampAlias({ '@timestamp': { type: 'date' }, time: { type: 'date' } }, [
      'time',
    ]);
    expect(fields['@timestamp']).toEqual({ type: 'alias', path: 'time' });
  });

  it('keeps the mappings when documents carry @timestamp or there is no time field', () => {
    const fields = { '@timestamp': { type: 'date' } };
    expect(withTimestampAlias(fields, ['@timestamp', 'time'])).toBe(fields);
    expect(withTimestampAlias(fields, [])).toBe(fields);
  });
});

describe('isTimeSeriesIndex', () => {
  it('is true when the index reports index.timestamp_field', async () => {
    const caller = jest
      .fn()
      .mockResolvedValue({ idx: { settings: { index: { timestamp_field: '@timestamp' } } } });
    expect(await isTimeSeriesIndex(caller, 'idx')).toBe(true);
    expect(caller).toHaveBeenCalledWith('indices.getSettings', { index: 'idx' });
  });

  it('is false for indices without index.timestamp_field', async () => {
    const caller = jest.fn().mockResolvedValue({ idx: { settings: { index: {} } } });
    expect(await isTimeSeriesIndex(caller, 'idx')).toBe(false);
  });

  it('is true when the settings cannot be read yet', async () => {
    const caller = jest.fn().mockRejectedValue(new Error('[index_not_found_exception]'));
    expect(await isTimeSeriesIndex(caller, 'idx')).toBe(true);
  });
});

describe('isNotReadyRejection', () => {
  it.each([
    [{ index: { status: 404, error: { type: 'index_not_found_exception' } } }, true],
    [
      {
        index: {
          status: 400,
          error: { type: 'illegal_argument_exception', reason: 'Bad Request' },
        },
      },
      true,
    ],
    [
      {
        index: {
          status: 400,
          error: {
            type: 'illegal_argument_exception',
            reason: 'document is missing required timestamp field [@timestamp]',
          },
        },
      },
      false,
    ],
    [{ index: { status: 503, error: { type: 'exception' } } }, false],
  ])('%j -> %s', (item, expected) => {
    expect(isNotReadyRejection(item)).toBe(expected);
  });
});

describe('isIndexNotFoundError', () => {
  it('matches the error body or message', () => {
    expect(isIndexNotFoundError({ body: { error: { type: 'index_not_found_exception' } } })).toBe(
      true
    );
    expect(isIndexNotFoundError(new Error('[index_not_found_exception] no such index'))).toBe(true);
    expect(isIndexNotFoundError(new Error('[cluster_block_exception]'))).toBe(false);
  });
});
