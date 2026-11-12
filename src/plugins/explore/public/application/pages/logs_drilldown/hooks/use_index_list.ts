/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { DataStructure, DEFAULT_DATA } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { BrowsableItem } from '../types';
import { getErrorStatus, maybeNotifyPermissionDenied } from '../permission_toast';
import { isServerlessDataSource } from '../serverless';

interface UseIndexListArgs {
  services: ExploreServices;
  /** Data source id to scope to (MDS, required). Empty/undefined ⇒ no resolution (MDS-only). */
  dataSourceId?: string;
  /** Debounced search string; filters the index names. */
  search: string;
}

interface UseIndexListResult {
  items: BrowsableItem[];
  loading: boolean;
  error?: string;
}

/**
 * Lists concrete indexes/aliases/data_streams for the active data source using the SAME API
 * the dataset-create UI uses (`datasetService.fetchOptions`), so the Explore browser stays in
 * sync with dataset creation. Search filters client-side over the returned names. Returns the FULL
 * filtered list — RowsView owns the visible-window pagination ("Load more"), so windowing here too
 * would double-paginate and silently cap the list.
 */
export const useIndexList = ({
  services,
  dataSourceId,
  search,
}: UseIndexListArgs): UseIndexListResult => {
  const [allItems, setAllItems] = useState<BrowsableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const fetchIndices = async () => {
      // MDS-only: index resolution must target an explicit data source. A bare resolve_index (empty
      // data source id) targets the local cluster, which does not exist under MDS (e.g. Neo) and 500s
      // on an unconfigured client. With no data source there is nothing to enumerate — return empty
      // and let the page's empty state guide the user to pick one. Never build the empty-id
      // LOCAL_DATASOURCE node.
      if (!dataSourceId) {
        setAllItems([]);
        setError(undefined);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(undefined);
      // Start the engine-type lookup now so it runs in parallel with resolve_index.
      const serverlessPromise = isServerlessDataSource(services, dataSourceId);
      try {
        const datasetService = services.data.query.queryString.getDatasetService();
        const indexType = datasetService.getType(DEFAULT_DATA.SET_TYPES.INDEX);
        if (!indexType) {
          throw new Error('Index dataset type is not registered');
        }

        // Fetch indexes for the target data source directly. We build the DATA_SOURCE node ourselves
        // rather than walking the data-source LIST first. index_type's fetch reads `dataStructure.id`
        // to scope the resolve_index call to this data source (MDS), so a hand-built node suffices.
        const indexRoot: DataStructure = {
          id: indexType.id,
          title: indexType.title,
          type: indexType.id,
        };
        const dataSourceNode: DataStructure = {
          id: dataSourceId,
          title: dataSourceId,
          type: 'DATA_SOURCE',
        };

        const indexesResult = await indexType.fetch(services as any, [indexRoot, dataSourceNode]);
        const items: BrowsableItem[] = (indexesResult.children ?? [])
          .map((child) => ({
            name: child.title,
            kind: 'index' as const,
            isRemote: Boolean(
              (child.meta as { isRemoteIndex?: boolean } | undefined)?.isRemoteIndex
            ),
          }))
          // Hide `.`-prefixed system indexes (plugin-internal, not for customers to explore).
          // Strip a cross-cluster `cluster:` prefix before the check so remote system indexes are
          // filtered too. Mirrors `get_matched_indices.ts` isSystemIndex.
          .filter((item) => {
            const bare = item.name.includes(':')
              ? item.name.slice(item.name.indexOf(':') + 1)
              : item.name;
            return !bare.startsWith('.');
          });

        // Enrich with creation dates and sort newest-first. `_cat/indices` (via the directquery
        // route) exposes `creation.date.string`; we ask it to sort descending and use that order,
        // falling back to name-descending if the call fails or a row lacks a date (always the
        // case on OpenSearch Serverless, which has no creation date).
        const sorted = await sortByCreationDate(items, services, dataSourceId, serverlessPromise);

        if (requestId === requestIdRef.current) {
          setAllItems(sorted);
        }
      } catch (e) {
        if (requestId === requestIdRef.current) {
          setError(e instanceof Error ? e.message : 'Unable to load indexes for this data source');
          setAllItems([]);
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    };

    fetchIndices();
  }, [services, dataSourceId]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? allItems.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
    : allItems;

  return { items: filtered, loading, error };
};

/** Parses a numeric `_cat` cell; empty or non-numeric cells are unknown (never 0). */
const parseCount = (value?: string): number | undefined => {
  if (value == null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

interface CatIndicesRow {
  index: string;
  'creation.date'?: string;
  'docs.count'?: string;
  health?: string;
  'store.size'?: string;
  pri?: string;
  rep?: string;
}

const FULL_CAT_QUERY = {
  format: 'json',
  h: 'index,creation.date,docs.count,health,store.size,pri,rep',
  s: 'creation.date:desc',
};
// What OpenSearch Serverless supports: no creation date (sorting by it is rejected with a 400) and
// no health/pri/rep.
const REDUCED_CAT_QUERY = { format: 'json', h: 'index,docs.count,store.size' };

/**
 * Orders indexes newest-first using `_cat/indices?h=index,creation.date&s=creation.date:desc`
 * via the directquery route. On any failure (route unavailable, remote-only cluster, etc.) it
 * falls back to name-descending, which approximates newest-first for date-suffixed/rolling
 * index names. OpenSearch Serverless has no creation date, so its rows are ordered by name and the
 * request asks only for the columns serverless returns. Serverless is detected from the data source
 * engine type; when that isn't saved (e.g. a data source created through the saved-objects API), a
 * 400 on the full request is retried once with the reduced columns.
 */
async function sortByCreationDate(
  items: BrowsableItem[],
  services: ExploreServices,
  dataSourceId?: string,
  serverlessPromise?: Promise<boolean>
): Promise<BrowsableItem[]> {
  const nameDescending = () => [...items].sort((a, b) => b.name.localeCompare(a.name));

  if (items.length === 0) return items;

  // MDS-only: without a data source there is no cluster to hit (no local cluster under MDS). Skip the
  // cat.indices call entirely rather than issue a bare `dataSourceMDSId=` request, and fall back to
  // name-descending ordering.
  if (!dataSourceId) return nameDescending();

  const catIndices = (query: Record<string, string>) =>
    services.http.get<CatIndicesRow[]>(
      `/api/directquery/dsl/cat.indices/dataSourceMDSId=${encodeURIComponent(dataSourceId)}`,
      { query }
    );

  try {
    const serverless = await (serverlessPromise ?? isServerlessDataSource(services, dataSourceId));
    // Also request `docs.count`, `health`, `store.size`, `pri`, `rep` — they ride along on this ONE
    // already-made cat.indices call (the route is a pass-through), so empty-index detection, the
    // health dot AND the health tooltip metadata cost zero extra round-trips. All are absent for
    // remote/closed indices → we leave those fields undefined (unknown), never 0/green.
    let response: CatIndicesRow[];
    if (serverless) {
      response = await catIndices(REDUCED_CAT_QUERY);
    } else {
      try {
        response = await catIndices(FULL_CAT_QUERY);
      } catch (e) {
        if (getErrorStatus(e) !== 400) throw e;
        response = await catIndices(REDUCED_CAT_QUERY);
      }
    }
    if (!Array.isArray(response)) return nameDescending();

    const createdByName = new Map<string, number>();
    const docsByName = new Map<string, number>();
    const healthByName = new Map<string, BrowsableItem['health']>();
    const metaByName = new Map<
      string,
      { storeSize?: string; primaryShards?: number; replicaCount?: number }
    >();
    response.forEach((row) => {
      const ts = Number(row['creation.date']);
      if (row.index && Number.isFinite(ts)) createdByName.set(row.index, ts);
      const docs = parseCount(row['docs.count']);
      if (row.index && docs !== undefined) docsByName.set(row.index, docs);
      const health = row.health?.toLowerCase();
      if (row.index && (health === 'green' || health === 'yellow' || health === 'red')) {
        healthByName.set(row.index, health);
      }
      if (row.index) {
        metaByName.set(row.index, {
          storeSize: row['store.size'] || undefined,
          primaryShards: parseCount(row.pri),
          replicaCount: parseCount(row.rep),
        });
      }
    });

    return [...items]
      .map((item) => ({
        ...item,
        createdAt: createdByName.get(item.name),
        docsCount: docsByName.get(item.name),
        health: healthByName.get(item.name),
        storeSize: metaByName.get(item.name)?.storeSize,
        primaryShards: metaByName.get(item.name)?.primaryShards,
        replicaCount: metaByName.get(item.name)?.replicaCount,
      }))
      .sort((a, b) => {
        // Rows with a known creation date come first, newest → oldest; then name-descending.
        if (a.createdAt != null && b.createdAt != null) return b.createdAt - a.createdAt;
        if (a.createdAt != null) return -1;
        if (b.createdAt != null) return 1;
        return b.name.localeCompare(a.name);
      });
  } catch (e) {
    // cat.indices enrichment is best-effort: on ANY failure we still show the list (name-ordered),
    // just without creation date / docs.count / health / size. An auth failure (401/403, e.g. no cat
    // permission) also raises the one-time "index details unavailable" permission toast.
    maybeNotifyPermissionDenied(services, e);
    return nameDescending();
  }
}
