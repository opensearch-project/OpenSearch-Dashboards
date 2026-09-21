/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { timefilterServiceMock } from '../../../data/public/query/timefilter/timefilter_service.mock';
import { PromQLQueryParser } from './promql_parser';
import { TimeCache } from './time_cache';

const makeHttpMock = (fields = defaultFields(), meta?: unknown) => ({
  post: jest.fn(() =>
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

function makeParser(httpMock = makeHttpMock(), onWarn = jest.fn(), abortSignal?: AbortSignal) {
  const timeCache = new TimeCache(timefilterServiceMock.createStartContract().timefilter, 100);
  return {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    parser: new PromQLQueryParser(timeCache, httpMock, onWarn, abortSignal),
    timeCache,
    httpMock,
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
  const { parser, httpMock } = makeParser();
  const request = parser.parseUrl(
    { name: 'my-request' },
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(request.dataObject.values).toEqual([
    { Time: 1000, Series: 'up{job="prometheus"}', Labels: { job: 'prometheus' }, Value: 1 },
    { Time: 2000, Series: 'up{job="node"}', Labels: { job: 'node' }, Value: 0 },
  ]);

  expect(httpMock.post).toHaveBeenCalledTimes(1);
  const [path, options] = httpMock.post.mock.calls[0];
  expect(path).toBe('/api/enhancements/search/promql');
  const body = JSON.parse(options.body);
  expect(body.query.query).toBe('up');
  expect(body.query.language).toBe('PROMQL');
  expect(body.query.dataset.id).toBe('promql_source');
  expect(body.query.dataset.type).toBe('PROMETHEUS');
  expect(body.timeRange).toBeUndefined();
});

test('it should include timeRange in request body when %context% is true', async () => {
  const { parser, timeCache, httpMock } = makeParser();
  timeCache.setTimeRange({ from: 'now-15m', to: 'now' });

  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  const body = JSON.parse(httpMock.post.mock.calls[0][1].body);
  expect(body.timeRange).toEqual({ from: 'now-15m', to: 'now' });
});

test('it should omit timeRange when %context% is true but timeCache has no range set', async () => {
  const { parser, httpMock } = makeParser();
  // timeCache not primed — _timeRange is undefined

  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  const body = JSON.parse(httpMock.post.mock.calls[0][1].body);
  expect(body.timeRange).toBeUndefined();
});

test('it should handle empty fields in response gracefully', async () => {
  const httpMock = makeHttpMock([]);
  const { parser } = makeParser(httpMock);
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(request.dataObject.values).toEqual([]);
});

test('it should populate multiple requests in parallel', async () => {
  const { parser, httpMock } = makeParser();
  const r1 = parser.parseUrl(
    { name: 'r1' },
    { '%datasource%': 'ds1', '%context%': true, body: { query: 'up' } }
  );
  const r2 = parser.parseUrl(
    { name: 'r2' },
    { '%datasource%': 'ds2', '%context%': true, body: { query: 'node_load1' } }
  );

  await parser.populateData([r1, r2]);

  expect(httpMock.post).toHaveBeenCalledTimes(2);
  expect(JSON.parse(httpMock.post.mock.calls[0][1].body).query.dataset.id).toBe('ds1');
  expect(JSON.parse(httpMock.post.mock.calls[1][1].body).query.dataset.id).toBe('ds2');
});

test('it should parse %maxdatapoints% and %step% into request options and strip them', async () => {
  const { parser, httpMock } = makeParser();
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

  const body = JSON.parse(httpMock.post.mock.calls[0][1].body);
  expect(body.options).toEqual({ maxDataPoints: 500, step: 30 });
});

test('it should omit options when %maxdatapoints% and %step% are absent', async () => {
  const { parser, httpMock } = makeParser();
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  expect(request.maxDataPoints).toBeUndefined();
  expect(request.step).toBeUndefined();

  await parser.populateData([request]);

  expect(JSON.parse(httpMock.post.mock.calls[0][1].body).options).toBeUndefined();
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

test('it should pass the abort signal to the http request', async () => {
  const controller = new AbortController();
  const { parser, httpMock } = makeParser(makeHttpMock(), jest.fn(), controller.signal);
  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', '%context%': true, body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(httpMock.post.mock.calls[0][1].signal).toBe(controller.signal);
});

test('it should warn when the response reports truncation', async () => {
  const truncation = { tableTruncated: true, totalSeriesCount: 5000, displayedSeriesCount: 2000 };
  const httpMock = makeHttpMock(defaultFields(), { truncation });
  const { parser, onWarn } = makeParser(httpMock);
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
  const httpMock = makeHttpMock(defaultFields(), { truncation });
  const { parser, onWarn } = makeParser(httpMock);
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
  const httpMock = makeHttpMock(bigFields);
  const { parser, onWarn } = makeParser(httpMock);
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
