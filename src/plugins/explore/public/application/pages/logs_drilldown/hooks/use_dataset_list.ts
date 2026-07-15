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

/**
 * Lists existing datasets (index-patterns) for the active data source, mapped to `BrowsableItem`s
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

        const datasets: BrowsableItem[] = (result.children ?? [])
          .filter((child) => {
            // Scope to the active data source: local cluster (no parent) when activeId is empty,
            // else match the parent data-source id.
            const parentId = child.parent?.id ?? '';
            return parentId === activeId;
          })
          .map((child) => ({
            name: child.title,
            kind: 'dataset' as const,
            datasetId: child.id,
            timeFieldName: (child.meta as { timeFieldName?: string } | undefined)?.timeFieldName,
          }));

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
