/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchSavedQueries, getVisibleSavedRows } from './fetch_saved_queries';

jest.mock('../application/legacy/discover/opensearch_dashboards_services', () => ({
  getRequestInspectorStats: jest.fn().mockReturnValue({}),
  getResponseInspectorStats: jest.fn().mockReturnValue({}),
}));
jest.mock('../application/utils/languages', () => ({
  prepareQueryForLanguage: (query: { query: string }) => ({ query: query.query }),
}));
// getTime is the real one: a data view with a time field gets a range filter on it.

const logs = { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' };
const prom = { id: 'prom', title: 'prom', type: 'PROMETHEUS' };

const createServices = (fetch: (fields: Record<string, any>) => Promise<any>) => {
  const created: Array<Record<string, any>> = [];
  const services = {
    uiSettings: { get: jest.fn().mockReturnValue(100) },
    data: {
      dataViews: {
        get: jest.fn(async (id: string) => ({
          id,
          timeFieldName: 'time',
          fields: [{ name: 'time', type: 'date' }],
          isTimeBased: () => true,
        })),
        convertToDataset: jest.fn(async (dataView: { id: string }) => ({ id: dataView.id })),
      },
      query: {
        queryString: {
          getDatasetService: () => ({ cacheDataset: jest.fn() }),
          getLanguageService: () => ({ getLanguage: () => undefined }),
        },
      },
      search: {
        searchSource: {
          create: jest.fn(async () => {
            let fields: Record<string, any> = {};
            const searchSource = {
              setFields: (next: Record<string, any>) => {
                fields = next;
                created.push(next);
              },
              getSearchRequestBody: () => Promise.resolve({}),
              fetch: () => fetch(fields),
              getDataFrame: () => ({
                schema: [{ name: 'value', type: 'number' }],
                meta: {},
              }),
            };
            return searchSource;
          }),
        },
      },
    },
  } as any;
  return { services, created };
};

const hitsFor = (id: string) => ({ hits: { hits: [{ _id: id, _source: { value: 1 } }] } });

const run = (services: any, rows: any[], options: Record<string, any> = {}) =>
  fetchSavedQueries(rows, {
    services,
    signal: new AbortController().signal,
    interpolate: (query) => query.replace('$env', 'prod'),
    ...options,
  });

describe('getVisibleSavedRows', () => {
  it('drops the hidden rows, keeping row order', () => {
    const rows = getVisibleSavedRows({
      queries: [
        ['A', { query: 'a', language: 'PPL' } as any],
        ['B', { query: 'b', language: 'PPL' } as any],
        ['C', { query: 'c', language: 'PPL' } as any],
      ],
      editorState: { rows: [['B', { isHidden: true }]] },
    });
    expect(rows.map(([refId]) => refId)).toEqual(['A', 'C']);
  });
});

describe('fetchSavedQueries', () => {
  it('runs each row on its own data view and query, in row order', async () => {
    const { services, created } = createServices(async (fields) => hitsFor(fields.index.id));
    const { series, failed } = await run(services, [
      ['A', { query: 'source = logs', language: 'PPL', dataset: logs }],
      ['B', { query: 'up', language: 'PROMQL', dataset: prom }],
    ]);

    expect(failed).toEqual([]);
    expect(series.map((s) => s.refId)).toEqual(['A', 'B']);
    // expect(series[1].rows).toEqual([{ _id: 'prom', _source: { value: 1 } }]);
    // expect(series[1].fieldSchema).toEqual([{ name: 'value', type: 'number' }]);
    // Flattened, as the editor's series are.
    expect(series[1].rows).toEqual([{ value: 1 }]);
    expect(series[1].fieldSchema).toEqual([{ name: 'value', type: 'number' }]);
    expect(
      created.map((fields) => [fields.index.id, fields.query.query, fields.query.language])
    ).toEqual([
      ['logs', 'source = logs', 'PPL'],
      ['prom', 'up', 'PROMQL'],
    ]);
    // Index patterns load from saved objects; other dataset types only from the cache.
    expect(services.data.dataViews.get).toHaveBeenCalledWith('logs', false);
    expect(services.data.dataViews.get).toHaveBeenCalledWith('prom', true);
  });

  it("applies the panel's filters and time range, and replaces variables", async () => {
    const { services, created } = createServices(async () => hitsFor('x'));
    const filter = { meta: {}, query: { match_all: {} } };
    await run(
      services,
      [['A', { query: 'source = logs | where env = "$env"', language: 'PPL', dataset: logs }]],
      { filters: [filter], timeRange: { from: 'now-1h', to: 'now' } }
    );

    expect(created[0].filter).toHaveLength(2);
    expect(created[0].filter[0]).toBe(filter);
    expect(created[0].filter[1].range).toHaveProperty('time');
    expect(created[0].query.query).toBe('source = logs | where env = "prod"');
  });

  it("keeps a metrics row's options, without a refId for one PromQL row, and drops a logs row's", async () => {
    const { services, created } = createServices(async () => hitsFor('x'));
    await run(services, [
      ['A', { query: 'q', language: 'PPL', dataset: logs, queryOptions: { maxDataPoints: 5 } }],
      ['B', { query: 'up', language: 'PROMQL', dataset: prom, queryOptions: { maxDataPoints: 5 } }],
    ]);

    expect(created[0].query.queryOptions).toBeUndefined();
    // expect(created[1].query.queryOptions).toEqual({ maxDataPoints: 5 });
    // // The refId: the server prefixes the row's series names with it, as in the editor.
    // expect(created[1].query.queryOptions).toEqual({ maxDataPoints: 5, refId: 'B' });
    // One PromQL row keeps its plain series names: no refId.
    expect(created[1].query.queryOptions).toEqual({ maxDataPoints: 5 });
  });

  it('adds each PromQL row its refId with two or more PromQL rows', async () => {
    const { services, created } = createServices(async () => hitsFor('x'));
    await run(services, [
      ['A', { query: 'up', language: 'PROMQL', dataset: prom, queryOptions: { maxDataPoints: 5 } }],
      ['B', { query: 'up', language: 'PROMQL', dataset: prom, queryOptions: { maxDataPoints: 5 } }],
    ]);

    expect(created.map((c: any) => c.query.queryOptions.refId)).toEqual(['A', 'B']);
  });

  it('skips a row without a dataset or with an empty query', async () => {
    const { services } = createServices(async () => hitsFor('x'));
    const { series, failed } = await run(services, [
      ['A', { query: 'q', language: 'PPL', dataset: undefined }],
      ['B', { query: '  ', language: 'PROMQL', dataset: prom }],
    ]);

    expect(series).toEqual([]);
    expect(failed).toEqual([]);
    expect(services.data.search.searchSource.create).not.toHaveBeenCalled();
  });

  it("reports a failing row and still returns the others'", async () => {
    const boom = new Error('boom');
    const { services } = createServices(async (fields) => {
      if (fields.index.id === 'prom') throw boom;
      return hitsFor('logs');
    });
    const { series, failed } = await run(services, [
      ['A', { query: 'q', language: 'PPL', dataset: logs }],
      ['B', { query: 'up', language: 'PROMQL', dataset: prom }],
    ]);

    expect(series.map((s) => s.refId)).toEqual(['A']);
    expect(failed).toEqual([{ refId: 'B', error: boom }]);
  });

  it('starts one inspector request per row', async () => {
    const { services } = createServices(async () => hitsFor('x'));
    const request = { stats: jest.fn().mockReturnThis(), json: jest.fn(), ok: jest.fn() };
    const requests = { start: jest.fn().mockReturnValue(request) } as any;
    await run(
      services,
      [
        ['A', { query: 'q', language: 'PPL', dataset: logs }],
        ['B', { query: 'up', language: 'PROMQL', dataset: prom }],
      ],
      { requests }
    );

    expect(requests.start.mock.calls.map(([title]: [string]) => title)).toEqual([
      'Query A',
      'Query B',
    ]);
  });
});
