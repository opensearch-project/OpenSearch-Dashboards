/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { DataStructure, DEFAULT_DATA } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { BrowsableItem } from '../types';

interface UseDatasetListArgs {
  services: ExploreServices;
  /** Data source id to scope to (MDS). Empty string / undefined = local cluster. */
  dataSourceId?: string;
  /** Debounced search string; filters dataset titles client-side. */
  search: string;
}

interface UseDatasetListResult {
  datasets: BrowsableItem[];
  loading: boolean;
  error?: string;
}

// Logs Drilldown only surfaces LOG datasets. A dataset qualifies when its saved-object `signalType`
// is 'logs' OR is absent (legacy index-patterns predate signal typing — treat them as logs). Traces
// and metrics datasets are hidden. `signalType` isn't carried on the shared index-pattern fetch, so
// we resolve it client-side via one saved-objects lookup and filter here (drilldown-local).
const SIGNAL_TYPE_LOGS = 'logs';

/**
 * Lists existing LOG datasets (index-patterns) for the active data source, mapped to `BrowsableItem`s
 * (`kind:'dataset'`). These render first in the Rows view — they're already activated, so their
 * primary action is a direct "Query". Uses the same `datasetService` the dataset-create UI uses.
 */
export const useDatasetList = ({
  services,
  dataSourceId,
  search,
}: UseDatasetListArgs): UseDatasetListResult => {
  const [all, setAll] = useState<BrowsableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const run = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const datasetService = services.data.query.queryString.getDatasetService();
        const type = datasetService.getType(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
        if (!type) {
          if (requestId === requestIdRef.current) setAll([]);
          return;
        }
        const root: DataStructure = { id: type.id, title: type.title, type: type.id };
        const result = await type.fetch(services as any, [root]);
        const activeId = dataSourceId ?? '';

        // Resolve each index-pattern's signalType (not carried on the shared fetch above) so we can
        // keep only LOG datasets. One saved-objects lookup; map id → signalType.
        const signalTypeById = new Map<string, string | undefined>();
        try {
          const so = await services.savedObjects.client.find<{ signalType?: string }>({
            type: 'index-pattern',
            fields: ['signalType'],
            perPage: 10000,
          });
          so.savedObjects.forEach((s) => signalTypeById.set(s.id, s.attributes?.signalType));
        } catch {
          // If the lookup fails, fall back to showing all (data-source-scoped) datasets rather than
          // hiding everything — better to over-show than to blank the list.
        }
        const isLogDataset = (id: string): boolean => {
          if (signalTypeById.size === 0) return true; // lookup unavailable → don't filter
          const st = signalTypeById.get(id);
          // Logs, or untyped/legacy index-patterns (no signalType). Traces/metrics are excluded.
          return st === SIGNAL_TYPE_LOGS || st == null;
        };

        const datasets: BrowsableItem[] = (result.children ?? [])
          .filter((child) => {
            // Scope to the active data source: local cluster (no parent) when activeId is empty,
            // else match the parent data-source id.
            const parentId = child.parent?.id ?? '';
            return parentId === activeId;
          })
          // Logs-only: hide traces/metrics datasets; keep logs + untyped legacy index-patterns.
          .filter((child) => isLogDataset(child.id))
          .map((child) => {
            const meta = child.meta as { timeFieldName?: string; displayName?: string } | undefined;
            return {
              name: child.title,
              // Friendly name (index-pattern displayName) → shown as the card label; the pattern
              // (`name`) stays the identity for coverage/activation/create-seeding.
              displayName: meta?.displayName || undefined,
              kind: 'dataset' as const,
              datasetId: child.id,
              timeFieldName: meta?.timeFieldName,
            };
          });

        if (requestId === requestIdRef.current) setAll(datasets);
      } catch (e) {
        if (requestId === requestIdRef.current) {
          setError(e instanceof Error ? e.message : 'Unable to load datasets');
          setAll([]);
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    };
    run();
  }, [services, dataSourceId]);

  const normalized = search.trim().toLowerCase();
  const datasets = normalized ? all.filter((d) => d.name.toLowerCase().includes(normalized)) : all;

  return { datasets, loading, error };
};
