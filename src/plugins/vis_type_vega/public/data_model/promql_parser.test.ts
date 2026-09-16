/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { timefilterServiceMock } from '../../../data/public/query/timefilter/timefilter_service.mock';
import { PromQLQueryParser } from './promql_parser';
import { TimeCache } from './time_cache';

const makeHttpMock = (fields = defaultFields()) => ({
  post: jest.fn(() =>
    Promise.resolve({
      body: { fields },
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

function makeParser(httpMock = makeHttpMock()) {
  const timeCache = new TimeCache(timefilterServiceMock.createStartContract().timefilter, 100);
  // @ts-expect-error TS2345 TODO(ts-error): fixme
  return { parser: new PromQLQueryParser(timeCache, httpMock), timeCache, httpMock };
}

test('it should throw if query is missing', () => {
  const { parser } = makeParser();
  expect(() => parser.parseUrl({}, { '%datasource%': 'myds' })).toThrow();
  expect(() => parser.parseUrl({}, { '%datasource%': 'myds', body: {} })).toThrow();
  expect(() =>
    parser.parseUrl({}, { '%datasource%': 'myds', body: { query: 123 } })
  ).toThrow();
});

test('it should throw if %datasource% is missing', () => {
  const { parser } = makeParser();
  expect(() => parser.parseUrl({}, { body: { query: 'up' } })).toThrow();
});

test('it should parse url object and strip %datasource%', () => {
  const { parser } = makeParser();
  const result = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', body: { query: 'up' } }
  );
  expect(result.dataObject).toEqual({});
  expect(result.datasource).toBe('promql_source');
  expect(result.useContext).toBe(false);
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
    { '%datasource%': 'promql_source', body: { query: 'up' } }
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

test('it should omit timeRange when %context% is false', async () => {
  const { parser, timeCache, httpMock } = makeParser();
  timeCache.setTimeRange({ from: 'now-1h', to: 'now' });

  const request = parser.parseUrl(
    {},
    { '%datasource%': 'promql_source', body: { query: 'up' } }
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
    { '%datasource%': 'promql_source', body: { query: 'up' } }
  );

  await parser.populateData([request]);

  expect(request.dataObject.values).toEqual([]);
});

test('it should populate multiple requests in parallel', async () => {
  const { parser, httpMock } = makeParser();
  const r1 = parser.parseUrl({ name: 'r1' }, { '%datasource%': 'ds1', body: { query: 'up' } });
  const r2 = parser.parseUrl(
    { name: 'r2' },
    { '%datasource%': 'ds2', body: { query: 'node_load1' } }
  );

  await parser.populateData([r1, r2]);

  expect(httpMock.post).toHaveBeenCalledTimes(2);
  expect(JSON.parse(httpMock.post.mock.calls[0][1].body).query.dataset.id).toBe('ds1');
  expect(JSON.parse(httpMock.post.mock.calls[1][1].body).query.dataset.id).toBe('ds2');
});
