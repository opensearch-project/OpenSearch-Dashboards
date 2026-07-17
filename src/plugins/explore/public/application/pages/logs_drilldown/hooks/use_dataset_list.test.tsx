/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useDatasetList } from './use_dataset_list';

const patternFetch = jest.fn();

// `signalTypes`: id → signalType saved-object attribute, returned by savedObjects.client.find so the
// hook can filter to log datasets. Default {} → find resolves an empty set → hook shows all (fallback).
const makeServices = (
  typeRegistered = true,
  signalTypes: Record<string, string | undefined> = {}
) =>
  ({
    data: {
      query: {
        queryString: {
          getDatasetService: () => ({
            getType: (t: string) =>
              t === 'INDEX_PATTERN' && typeRegistered
                ? { id: 'INDEX_PATTERN', title: 'Index patterns', fetch: patternFetch }
                : undefined,
          }),
        },
      },
    },
    savedObjects: {
      client: {
        find: jest.fn().mockResolvedValue({
          savedObjects: Object.entries(signalTypes).map(([id, signalType]) => ({
            id,
            attributes: { signalType },
          })),
        }),
      },
    },
  }) as unknown as any;

// Build a children result where each child carries a parent data-source id + a time field.
const children = (
  rows: Array<{
    title: string;
    id: string;
    parentId?: string;
    timeFieldName?: string;
    displayName?: string;
  }>
) => ({
  children: rows.map((r) => ({
    title: r.title,
    id: r.id,
    parent: r.parentId != null ? { id: r.parentId } : undefined,
    meta: { timeFieldName: r.timeFieldName, displayName: r.displayName },
  })),
});

let result: ReturnType<typeof useDatasetList>;
const Harness: React.FC<{ services: any; search: string; dataSourceId?: string }> = ({
  services,
  search,
  dataSourceId,
}) => {
  result = useDatasetList({ services, search, dataSourceId });
  return null;
};

describe('useDatasetList', () => {
  beforeEach(() => jest.clearAllMocks());

  // --- positive cases ---
  it('lists local-cluster datasets (no parent) and maps id + timeFieldName', async () => {
    patternFetch.mockResolvedValue(
      children([
        { title: 'logs-app-*', id: 'ds-logs', timeFieldName: '@timestamp' },
        { title: 'orders-*', id: 'ds-orders' },
      ])
    );
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets).toEqual([
      {
        name: 'logs-app-*',
        displayName: undefined,
        kind: 'dataset',
        datasetId: 'ds-logs',
        timeFieldName: '@timestamp',
      },
      {
        name: 'orders-*',
        displayName: undefined,
        kind: 'dataset',
        datasetId: 'ds-orders',
        timeFieldName: undefined,
      },
    ]);
  });

  it('maps the friendly displayName when the index-pattern has one (pattern stays as name)', async () => {
    patternFetch.mockResolvedValue(
      children([
        { title: 'nginx-access-*', id: 'ds1', displayName: 'Nginx access logs' },
        { title: 'orders-*', id: 'ds2' }, // no displayName → undefined
      ])
    );
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets[0]).toEqual(
      expect.objectContaining({ name: 'nginx-access-*', displayName: 'Nginx access logs' })
    );
    expect(result.datasets[1].displayName).toBeUndefined();
  });

  it('scopes to the active data source id (MDS), excluding datasets from other sources', async () => {
    patternFetch.mockResolvedValue(
      children([
        { title: 'ds2-logs', id: '1', parentId: 'ds-2' },
        { title: 'local-logs', id: '2', parentId: '' },
        { title: 'ds3-logs', id: '3', parentId: 'ds-3' },
      ])
    );
    render(<Harness services={makeServices()} search="" dataSourceId="ds-2" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets.map((d) => d.name)).toEqual(['ds2-logs']);
  });

  it('filters client-side by search term (case-insensitive)', async () => {
    patternFetch.mockResolvedValue(
      children([
        { title: 'logs-app-*', id: '1' },
        { title: 'Orders', id: '2' },
        { title: 'LOGS-db', id: '3' },
      ])
    );
    render(<Harness services={makeServices()} search="logs" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets.map((d) => d.name).sort()).toEqual(['LOGS-db', 'logs-app-*']);
  });

  // --- negative cases ---
  it('returns an empty list (no error) when the INDEX_PATTERN type is not registered', async () => {
    patternFetch.mockResolvedValue(children([{ title: 'x', id: '1' }]));
    render(<Harness services={makeServices(false)} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('surfaces an error and empties the list when the fetch rejects', async () => {
    patternFetch.mockRejectedValue(new Error('saved objects unavailable'));
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.error).toBe('saved objects unavailable');
    expect(result.datasets).toEqual([]);
  });

  it('handles a fetch result with no children', async () => {
    patternFetch.mockResolvedValue({});
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets).toEqual([]);
  });

  // --- logs-only signalType filter ---
  it('shows only log + untyped datasets, hiding traces/metrics (by signalType)', async () => {
    patternFetch.mockResolvedValue(
      children([
        { title: 'app-logs-*', id: 'log-1' },
        { title: 'otel-traces-*', id: 'trace-1' },
        { title: 'prom-metrics-*', id: 'metric-1' },
        { title: 'legacy-*', id: 'legacy-1' }, // no signalType (legacy) → kept
      ])
    );
    const services = makeServices(true, {
      'log-1': 'logs',
      'trace-1': 'traces',
      'metric-1': 'metrics',
      // legacy-1 intentionally absent → undefined signalType
    });
    render(<Harness services={services} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets.map((d) => d.name)).toEqual(['app-logs-*', 'legacy-*']);
  });

  it('falls back to showing all datasets when the signalType lookup returns nothing', async () => {
    patternFetch.mockResolvedValue(
      children([
        { title: 'app-logs-*', id: 'log-1' },
        { title: 'otel-traces-*', id: 'trace-1' },
      ])
    );
    // No signalTypes provided → find resolves empty → hook does not filter (over-show, not blank).
    render(<Harness services={makeServices()} search="" />);
    await waitFor(() => expect(result.loading).toBe(false));
    expect(result.datasets.map((d) => d.name).sort()).toEqual(['app-logs-*', 'otel-traces-*']);
  });
});
