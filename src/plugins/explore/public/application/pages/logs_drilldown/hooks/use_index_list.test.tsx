/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useIndexList } from './use_index_list';
import { resetPermissionToast } from '../permission_toast';
import { resetServerlessCaches } from '../serverless';

// The INDEX dataset type's fetch() result (children = indexes) + the _cat/indices creation dates.
const indexFetch = jest.fn();
const httpGet = jest.fn();
// The data-source saved object lookup (engine type). Default: lookup fails → treated as not serverless.
const savedObjectsGet = jest.fn();
const addWarning = jest.fn();

const makeServices = () =>
  ({
    data: {
      query: {
        queryString: {
          getDatasetService: () => ({
            getType: (t: string) =>
              t === 'INDEXES' ? { id: 'INDEXES', title: 'Indexes', fetch: indexFetch } : undefined,
          }),
        },
      },
    },
    http: { get: httpGet },
    savedObjects: { client: { get: savedObjectsGet } },
    notifications: { toasts: { addWarning } },
  }) as unknown as any;

const serverlessDataSource = () =>
  savedObjectsGet.mockResolvedValue({
    attributes: { dataSourceEngineType: 'OpenSearch Serverless' },
  });

const children = (names: string[], remote: string[] = []) => ({
  children: names.map((title) => ({
    title,
    meta: { isRemoteIndex: remote.includes(title) },
  })),
});

let result: ReturnType<typeof useIndexList>;
// MDS-only: the hook requires a data source id, so the harness defaults to one. Cases that exercise
// the no-data-source path pass `dataSourceId={undefined}` explicitly.
const Harness: React.FC<{ services: any; search: string; dataSourceId?: string }> = ({
  services,
  search,
  dataSourceId = 'ds-default',
}) => {
  result = useIndexList({ services, search, dataSourceId });
  return <div data-test-subj="names">{result.items.map((i) => i.name).join(',')}</div>;
};

describe('useIndexList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPermissionToast();
    resetServerlessCaches();
    // Default: _cat/indices returns nothing usable → name-descending fallback.
    httpGet.mockResolvedValue([]);
    savedObjectsGet.mockRejectedValue(new Error('not found'));
  });

  // --- positive cases ---
  it('lists indexes for the data source and filters out `.`-prefixed system indexes', async () => {
    indexFetch.mockResolvedValue(children(['logs-app-1', '.kibana_1', 'orders']));
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    // `.kibana_1` is excluded; the rest are name-descending (no creation dates).
    expect(result.items.map((i) => i.name)).toEqual(['orders', 'logs-app-1']);
  });

  it('also filters `.`-prefixed remote system indexes after stripping the cluster: prefix', async () => {
    indexFetch.mockResolvedValue(
      children(['remote:.internal', 'remote:app-logs'], ['remote:app-logs'])
    );
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    const names = result.items.map((i) => i.name);
    expect(names).toContain('remote:app-logs');
    expect(names).not.toContain('remote:.internal');
    // Remote flag is carried through from meta.isRemoteIndex.
    expect(result.items.find((i) => i.name === 'remote:app-logs')?.isRemote).toBe(true);
  });

  it('orders newest-first using _cat/indices creation dates when available', async () => {
    indexFetch.mockResolvedValue(children(['a', 'b', 'c']));
    httpGet.mockResolvedValue([
      { index: 'a', 'creation.date': '100' },
      { index: 'b', 'creation.date': '300' }, // newest
      { index: 'c', 'creation.date': '200' },
    ]);
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.items.map((i) => i.name)).toEqual(['b', 'c', 'a']);
    // One cat.indices call carries creation.date + docs.count + health + store.size/pri/rep
    // (no extra round-trips).
    expect(httpGet.mock.calls[0][1].query.h).toBe(
      'index,creation.date,docs.count,health,store.size,pri,rep'
    );
  });

  it('maps store size + shard layout (store.size/pri/rep) onto items; missing → undefined', async () => {
    indexFetch.mockResolvedValue(children(['full', 'partial']));
    httpGet.mockResolvedValue([
      { index: 'full', 'creation.date': '300', 'store.size': '2.4gb', pri: '5', rep: '1' },
      { index: 'partial', 'creation.date': '200' }, // no size/shards (e.g. remote/closed)
    ]);
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    const byName = Object.fromEntries(result.items.map((i: any) => [i.name, i]));
    expect(byName.full.storeSize).toBe('2.4gb');
    expect(byName.full.primaryShards).toBe(5);
    expect(byName.full.replicaCount).toBe(1);
    expect(byName.partial.storeSize).toBeUndefined();
    expect(byName.partial.primaryShards).toBeUndefined();
    expect(byName.partial.replicaCount).toBeUndefined();
  });

  it('maps index health (green/yellow/red) onto items; unknown/invalid → undefined', async () => {
    indexFetch.mockResolvedValue(children(['green-idx', 'red-idx', 'unknown-idx']));
    httpGet.mockResolvedValue([
      { index: 'green-idx', 'creation.date': '300', health: 'green' },
      { index: 'red-idx', 'creation.date': '200', health: 'RED' }, // case-insensitive
      { index: 'unknown-idx', 'creation.date': '100' }, // no health (e.g. remote/closed)
    ]);
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    const byName = Object.fromEntries(result.items.map((i: any) => [i.name, i.health]));
    expect(byName['green-idx']).toBe('green');
    expect(byName['red-idx']).toBe('red'); // normalized to lowercase
    expect(byName['unknown-idx']).toBeUndefined(); // absent → unknown
  });

  it('maps docs.count onto items (0 preserved for empty-index, missing → undefined)', async () => {
    indexFetch.mockResolvedValue(children(['live', 'empty', 'unknown']));
    httpGet.mockResolvedValue([
      { index: 'live', 'creation.date': '300', 'docs.count': '4200' },
      { index: 'empty', 'creation.date': '200', 'docs.count': '0' },
      { index: 'unknown', 'creation.date': '100' }, // no docs.count (e.g. remote/closed)
    ]);
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    const byName = Object.fromEntries(result.items.map((i: any) => [i.name, i.docsCount]));
    expect(byName.live).toBe(4200);
    expect(byName.empty).toBe(0); // explicit 0 preserved → empty-index detection
    expect(byName.unknown).toBeUndefined(); // absent → unknown, never coerced to 0
  });

  it('filters client-side by the search term (case-insensitive)', async () => {
    indexFetch.mockResolvedValue(children(['logs-app-1', 'orders', 'LOGS-db']));
    render(<Harness services={makeServices()} search="logs" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.items.map((i) => i.name).sort()).toEqual(['LOGS-db', 'logs-app-1']);
  });

  it('scopes the fetch + cat.indices call to a data source id (MDS)', async () => {
    indexFetch.mockResolvedValue(children(['ds2-logs']));
    render(<Harness services={makeServices()} search="" dataSourceId="ds-2" />);
    await waitFor(() => expect(result.loading).toBe(false));
    // The DATA_SOURCE node passed to fetch carries the id.
    const dataSourceNode = indexFetch.mock.calls[0][1][1];
    expect(dataSourceNode.id).toBe('ds-2');
    expect(httpGet.mock.calls[0][0]).toContain('dataSourceMDSId=ds-2');
  });

  // MDS-only: no local cluster to enumerate → no request, empty result.
  // Empty-string id is the "local cluster" sentinel; it must be treated as "no data source".
  it('does NOT resolve indexes when there is no data source id (never hits the local cluster)', async () => {
    render(<Harness services={makeServices()} search="" dataSourceId="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(indexFetch).not.toHaveBeenCalled();
    expect(httpGet).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('returns the FULL list (no internal cap) — RowsView owns the visible-window pagination', async () => {
    const many = Array.from({ length: 60 }, (_, i) => `idx-${String(i).padStart(2, '0')}`);
    indexFetch.mockResolvedValue(children(many));
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    // All 60 are returned — no silent 50-cap that would hide indexes from search / Load more.
    expect(result.items.length).toBe(60);
  });

  // --- negative cases ---
  it('surfaces an error and empties the list when the INDEX type is not registered', async () => {
    const services = {
      data: {
        query: { queryString: { getDatasetService: () => ({ getType: () => undefined }) } },
      },
      http: { get: httpGet },
    } as unknown as any;
    render(<Harness services={services} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.error).toMatch(/not registered/);
    expect(result.items).toEqual([]);
  });

  it('surfaces an error when the index fetch rejects', async () => {
    indexFetch.mockRejectedValue(new Error('resolve_index failed'));
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.error).toBe('resolve_index failed');
    expect(result.items).toEqual([]);
  });

  it('falls back to name-descending when the cat.indices call rejects', async () => {
    indexFetch.mockResolvedValue(children(['a', 'z', 'm']));
    httpGet.mockRejectedValue(new Error('directquery route unavailable'));
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.items.map((i) => i.name)).toEqual(['z', 'm', 'a']);
    // The fetch itself succeeded, so there is no error surfaced.
    expect(result.error).toBeUndefined();
  });

  // --- OpenSearch Serverless data sources ---
  it('asks serverless only for the columns it supports (no creation.date, no sort)', async () => {
    serverlessDataSource();
    indexFetch.mockResolvedValue(children(['logs-a']));
    render(<Harness services={makeServices()} search="" dataSourceId="ds-sl" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(savedObjectsGet).toHaveBeenCalledWith('data-source', 'ds-sl');
    const query = httpGet.mock.calls[0][1].query;
    expect(query.h).toBe('index,docs.count,store.size');
    expect(query.s).toBeUndefined();
  });

  it('keeps serverless docs/size, leaves health and shard counts unknown, orders by name', async () => {
    serverlessDataSource();
    indexFetch.mockResolvedValue(children(['logs-a', 'logs-c', 'logs-b']));
    // Serverless `_cat/indices` shape: no creation.date; health/pri/rep are empty strings.
    httpGet.mockResolvedValue([
      { index: 'logs-a', 'docs.count': '12', 'store.size': '3.7kb', health: '', pri: '', rep: '' },
      { index: 'logs-b', 'docs.count': '0', 'store.size': '0b', health: '', pri: '', rep: '' },
      { index: 'logs-c', 'docs.count': '7', 'store.size': '1kb' },
    ]);
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.items.map((i) => i.name)).toEqual(['logs-c', 'logs-b', 'logs-a']);
    const byName = Object.fromEntries(result.items.map((i: any) => [i.name, i]));
    expect(byName['logs-a'].docsCount).toBe(12);
    expect(byName['logs-a'].storeSize).toBe('3.7kb');
    expect(byName['logs-b'].docsCount).toBe(0); // real 0 still drives empty-index detection
    expect(byName['logs-a'].health).toBeUndefined();
    expect(byName['logs-a'].primaryShards).toBeUndefined(); // '' is unknown, never 0
    expect(byName['logs-a'].replicaCount).toBeUndefined();
    expect(byName['logs-a'].createdAt).toBeUndefined();
  });

  it('keeps the provisioned request (creation.date sort) when the data source is not serverless', async () => {
    savedObjectsGet.mockResolvedValue({ attributes: { dataSourceEngineType: 'OpenSearch' } });
    indexFetch.mockResolvedValue(children(['a']));
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    const query = httpGet.mock.calls[0][1].query;
    expect(query.h).toBe('index,creation.date,docs.count,health,store.size,pri,rep');
    expect(query.s).toBe('creation.date:desc');
  });

  it('does NOT show the permission toast when cat.indices fails with a non-auth 400', async () => {
    indexFetch.mockResolvedValue(children(['a', 'b']));
    httpGet.mockRejectedValue({
      statusCode: 400,
      message: 'unsupported_operation_exception: Unable to sort by unknown sort key',
    });
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.items.map((i) => i.name)).toEqual(['b', 'a']);
    expect(addWarning).not.toHaveBeenCalled();
  });

  it('retries a 400 with the serverless columns when the engine type is not saved', async () => {
    // e.g. a serverless data source created through the saved-objects API: no dataSourceEngineType.
    indexFetch.mockResolvedValue(children(['logs-a', 'logs-b']));
    httpGet
      .mockRejectedValueOnce({
        body: { statusCode: 400, message: 'Unable to sort by unknown sort key `creation.date`' },
      })
      .mockResolvedValueOnce([
        { index: 'logs-a', 'docs.count': '7', 'store.size': '1kb' },
        { index: 'logs-b', 'docs.count': '3', 'store.size': '2kb' },
      ]);
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(httpGet).toHaveBeenCalledTimes(2);
    expect(httpGet.mock.calls[0][1].query.s).toBe('creation.date:desc');
    expect(httpGet.mock.calls[1][1].query).toEqual({
      format: 'json',
      h: 'index,docs.count,store.size',
    });
    expect(result.items.map((i) => [i.name, i.docsCount, i.storeSize])).toEqual([
      ['logs-b', 3, '2kb'],
      ['logs-a', 7, '1kb'],
    ]);
    expect(addWarning).not.toHaveBeenCalled();
  });

  it('does not retry cat.indices for non-400 failures', async () => {
    indexFetch.mockResolvedValue(children(['a']));
    httpGet.mockRejectedValue({ statusCode: 500 });
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('looks up the engine type in parallel with resolve_index', async () => {
    let resolveIndexes: (v: unknown) => void = () => {};
    indexFetch.mockReturnValue(new Promise((r) => (resolveIndexes = r)));
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(savedObjectsGet).toHaveBeenCalledWith('data-source', 'ds-default'));
    resolveIndexes(children(['a']));
    await waitFor(() => expect(result.loading).toBe(false));
  });

  it('still shows the permission toast once when cat.indices is forbidden (403)', async () => {
    indexFetch.mockResolvedValue(children(['a']));
    httpGet.mockRejectedValue({ statusCode: 403 });
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(addWarning).toHaveBeenCalledTimes(1);
  });

  it('returns an empty list (no crash) when the fetch has no children', async () => {
    indexFetch.mockResolvedValue({});
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.items).toEqual([]);
  });
});
