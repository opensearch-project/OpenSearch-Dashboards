/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { timefilterServiceMock } from '../../../data/public/query/timefilter/timefilter_service.mock';
import { PromQLQueryParser } from './promql_parser';
import { TimeCache } from './time_cache';

const makeSearchApiMock = (fields = defaultFields(), meta?: unknown) => ({
  searchPromQL: jest.fn(() =>
    Promise.resolve({
      body: { fields, ...(meta ? { meta } : {}) },
    })
  ),
});

function defaultFields() {
  return [
    { name: 'Time', values: [1000, 2000] },
    { name: 'Series', values: ['up{job="prometheus"}', 'up{job="node"}'] },
    { name: 'Labels', values: [{ job: 'prometheus' }, { job: 'node' }] },
    { name: 'Value', values: [1, 0] },
  ];
}

function makeParser(searchApiMock = makeSearchApiMock(), onWarn = jest.fn()) {
  const timeCache = new TimeCache(timefilterServiceMock.createStartContract().timefilter, 100);
  return {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    parser: new PromQLQueryParser(timeCache, searchApiMock, onWarn),
    timeCache,
    searchApiMock,
    onWarn,
  };
}

test('it should throw if query is missing', () => {
  const { parser } = makeParser();
  expect(() => parser.parseUrl({}, { '%datasource%': 'myds', '%context%': true })).toThrow();
  expect(() =>
    parser.parseUrl({}, { '%datasource%': 'myds', '%context%': true, body: {} })
  ).toThrow();
  expect(() =>
    parser.parseUrl({}, { '%datasource%': 'myds', '%context%': true, body: { query: 123 } })
  ).toThrow();
});

test('it should throw if %datasource% is missing', () => {
  const { parser } = makeParser();
  expect(() => parser.parseUrl({}, { '%context%': true, body: { query: 'up' } })).toThrow();
});

test('it should throw if %context% is missing', () => {
  const { parser } = makeParser();
  expect(() =>
    parser.parseUrl({}, { '%datasource%': 'promql_source', body: { query: 'up' } })
  ).toThrow(/%context%/);
});

test('it should parse url object and strip %datasource%', () => {
  const { parser } = makeParser();
  const result = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );
  expect(result.dataObject).toEqual({});
  expect(result.datasource).toBe('promql_source');
  expect(result.useContext).toBe(true);
  expect(result.url['%datasource%']).toBeUndefined();
  expect(result.url).toEqual({ body: { query: 'up' } });
});

test('it should parse %context% and strip it from url', () => {
  const { parser } = makeParser();
  const result = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );
  expect(result.useContext).toBe(true);
  expect(result.url['%context%']).toBeUndefined();
});

test('it should populate data and transform DataFrame fields to flat records', async () => {
  const { parser, searchApiMock } = makeParser();
  const request = parser.parseUrl(
    { name: 'my-request' },
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(request.dataObject.values).toEqual([
    { Time: 1000, Series: 'up{job="prometheus"}', Labels: { job: 'prometheus' }, Value: 1 },
    { Time: 2000, Series: 'up{job="node"}', Labels: { job: 'node' }, Value: 0 },
  ]);

  expect(searchApiMock.searchPromQL).toHaveBeenCalledTimes(1);
  const [, body] = searchApiMock.searchPromQL.mock.calls[0];
  expect(body.query.query).toBe('up');
  expect(body.query.language).toBe('PROMQL');
  expect(body.query.dataset.id).toBe('promql_source');
  expect(body.query.dataset.type).toBe('PROMETHEUS');
  expect(body.timeRange).toBeUndefined();
});

test('it should include timeRange in request body when %context% is true', async () => {
  const { parser, timeCache, searchApiMock } = makeParser();
  timeCache.setTimeRange({ from: 'now-15m', to: 'now' });

  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  const [, body] = searchApiMock.searchPromQL.mock.calls[0];
  expect(body.timeRange).toEqual({ from: 'now-15m', to: 'now' });
});

test('it should omit timeRange when %context% is true but timeCache has no range set', async () => {
  const { parser, searchApiMock } = makeParser();
  // timeCache not primed — _timeRange is undefined

  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  const [, body] = searchApiMock.searchPromQL.mock.calls[0];
  expect(body.timeRange).toBeUndefined();
});

test('it should handle empty fields in response gracefully', async () => {
  const searchApiMock = makeSearchApiMock([]);
  const { parser } = makeParser(searchApiMock);
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(request.dataObject.values).toEqual([]);
});

test('it should populate multiple requests in parallel', async () => {
  const { parser, searchApiMock } = makeParser();
  const r1 = parser.parseUrl(
    { name: 'r1' },
    { '%datasource%': 'ds1', '%context%': true, body: { query: 'up' } }
  );
  const r2 = parser.parseUrl(
    { name: 'r2' },
    { '%datasource%': 'ds2', '%context%': true, body: { query: 'node_load1' } }
  );

  await parser.populateData([r1, r2]);

  expect(searchApiMock.searchPromQL).toHaveBeenCalledTimes(2);
  expect(searchApiMock.searchPromQL.mock.calls[0][1].query.dataset.id).toBe('ds1');
  expect(searchApiMock.searchPromQL.mock.calls[1][1].query.dataset.id).toBe('ds2');
});

test('it should parse %maxdatapoints% and %step% into request options and strip them', async () => {
  const { parser, searchApiMock } = makeParser();
  const request = parser.parseUrl(
    {},
    {
      '%datasource%': 'promql_source',
      '%context%': true,
      '%maxdatapoints%': 500,
      '%step%': 30,
      body: { query: 'up' },
    }
  );

  expect(request.maxDataPoints).toBe(500);
  expect(request.step).toBe(30);
  expect(request.url['%maxdatapoints%']).toBeUndefined();
  expect(request.url['%step%']).toBeUndefined();

  await parser.populateData([request]);

  const [, body] = searchApiMock.searchPromQL.mock.calls[0];
  expect(body.options).toEqual({ maxDataPoints: 500, step: 30 });
});

test('it should omit options when %maxdatapoints% and %step% are absent', async () => {
  const { parser, searchApiMock } = makeParser();
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  expect(request.maxDataPoints).toBeUndefined();
  expect(request.step).toBeUndefined();

  await parser.populateData([request]);

  expect(searchApiMock.searchPromQL.mock.calls[0][1].options).toBeUndefined();
});

test('it should ignore non-positive or non-numeric %maxdatapoints% and %step%', () => {
  const { parser } = makeParser();
  const request = parser.parseUrl(
    {},
    {
      '%datasource%': 'promql_source',
      '%context%': true,
      '%maxdatapoints%': 0,
      '%step%': 'abc',
      body: { query: 'up' },
    }
  );

  expect(request.maxDataPoints).toBeUndefined();
  expect(request.step).toBeUndefined();
});

test('it should use the request name as the inspector label', async () => {
  const { parser, searchApiMock } = makeParser();
  const request = parser.parseUrl(
    { name: 'my-metric' },
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(searchApiMock.searchPromQL.mock.calls[0][0]).toBe('my-metric');
});

test('it should warn when the response reports truncation', async () => {
  const truncation = { tableTruncated: true, totalSeriesCount: 5000, displayedSeriesCount: 2000 };
  const searchApiMock = makeSearchApiMock(defaultFields(), { truncation });
  const { parser, onWarn } = makeParser(searchApiMock);
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(onWarn).toHaveBeenCalledTimes(1);
  expect(onWarn.mock.calls[0][0]).toContain('2000');
  expect(onWarn.mock.calls[0][0]).toContain('5000');
});

test('it should not warn when truncation is not flagged', async () => {
  const truncation = { tableTruncated: false, totalSeriesCount: 10, displayedSeriesCount: 10 };
  const searchApiMock = makeSearchApiMock(defaultFields(), { truncation });
  const { parser, onWarn } = makeParser(searchApiMock);
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(onWarn).not.toHaveBeenCalled();
});

test('it should cap rows client-side and warn when response exceeds CLIENT_ROW_CAP', async () => {
  const rowCount = 30_001;
  const bigFields = [
    { name: 'Time', values: Array.from({ length: rowCount }, (_, i) => i * 1000) },
    { name: 'Series', values: Array.from({ length: rowCount }, () => 'up') },
    { name: 'Labels', values: Array.from({ length: rowCount }, () => ({})) },
    { name: 'Value', values: Array.from({ length: rowCount }, () => 1) },
  ];
  const searchApiMock = makeSearchApiMock(bigFields);
  const { parser, onWarn } = makeParser(searchApiMock);
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(request.dataObject.values).toHaveLength(30_000);
  expect(onWarn).toHaveBeenCalledTimes(1);
  expect(onWarn.mock.calls[0][0]).toContain('30000');
  expect(onWarn.mock.calls[0][0]).toContain('30001');
});

test('it should warn and continue when one of multiple requests fails', async () => {
  let callCount = 0;
  const mixedSearchApiMock = {
    searchPromQL: jest.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('network error'));
      return Promise.resolve({ body: { fields: defaultFields() } });
    }),
  };
  const { parser, onWarn } = makeParser(mixedSearchApiMock as any);
  const r1 = parser.parseUrl(
    { name: 'r1' },
    { '%datasource%': 'ds1', '%context%': true, body: { query: 'up' } }
  );
  const r2 = parser.parseUrl(
    { name: 'r2' },
    { '%datasource%': 'ds2', '%context%': true, body: { query: 'node_load1' } }
  );

  await parser.populateData([r1, r2]);

  // r2 should still have data despite r1 failing
  expect(r2.dataObject.values).toHaveLength(2);
  // r1 should be left without values
  expect(r1.dataObject.values).toBeUndefined();
  // a warning should identify the failing request by index
  expect(onWarn).toHaveBeenCalledTimes(1);
  expect(onWarn.mock.calls[0][0]).toContain('1');
  expect(onWarn.mock.calls[0][0]).toContain('network error');
});

test('it should warn for every failed request when all requests fail', async () => {
  const failingSearchApiMock = {
    searchPromQL: jest.fn(() => Promise.reject(new Error('timeout'))),
  };
  const { parser, onWarn } = makeParser(failingSearchApiMock as any);
  const r1 = parser.parseUrl(
    {},
    { '%datasource%': 'ds1', '%context%': true, body: { query: 'up' } }
  );
  const r2 = parser.parseUrl(
    {},
    { '%datasource%': 'ds2', '%context%': true, body: { query: 'node_load1' } }
  );

  await parser.populateData([r1, r2]);

  expect(onWarn).toHaveBeenCalledTimes(2);
});
