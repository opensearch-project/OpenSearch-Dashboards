/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { UI_SETTINGS } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  addColumn,
  removeColumn,
  moveColumn,
  setColumns,
} from '../../application/utils/state_management/slices';
import { selectColumns, selectQuery } from '../../application/utils/state_management/selectors';
import { DiscoverSidebar } from '.';
import { ExploreServices } from '../../types';
import { buildColumns } from '../../application/legacy/discover/application/utils/columns';
import { useDatasetContext } from '../../application/context';
import {
  defaultResultsProcessor,
  defaultPrepareQueryString,
} from '../../application/utils/state_management/actions/query_actions';
import { resultsCache } from '../../application/utils/state_management/slices';
import { useChangeQueryEditor } from '../../application/hooks';

export interface IDiscoverPanelProps {
  collapsePanel?: () => void;
}

// Shared empty values so the sidebar's memoized derivations are not invalidated by a fresh
// `{}` / `[]` on every render.
const EMPTY_COLUMNS: string[] = [];
const EMPTY_FIELD_COUNTS: Record<string, number> = {};
const EMPTY_HITS: any[] = [];

export function DiscoverPanel({ collapsePanel }: IDiscoverPanelProps) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const columns = useSelector(selectColumns);
  const query = useSelector(selectQuery);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const metadata = useSelector((state: any) => state.results[cacheKey]);
  const rawResults = metadata ? (resultsCache.get(cacheKey) ?? null) : null;
  const { dataset } = useDatasetContext();

  // Process raw results to get field counts and rows
  const processedResults = useMemo(() => {
    if (!rawResults || !dataset) {
      return null;
    }

    // Use defaultResultsProcessor without histogram (DiscoverPanel doesn't need chart data)
    const processed = defaultResultsProcessor(rawResults, dataset);
    return processed;
  }, [rawResults, dataset]);

  // Results are cleared when a query is (re)run and repopulated when it returns. Keep showing
  // the last results for the same dataset in between, so the sidebar does not tear down and
  // rebuild its field groups twice per query. A dataset change still starts from empty.
  const lastProcessedRef = useRef<{ datasetId?: string; results: typeof processedResults }>({
    results: null,
  });
  useEffect(() => {
    if (processedResults) {
      lastProcessedRef.current = { datasetId: dataset?.id, results: processedResults };
    }
  }, [processedResults, dataset?.id]);
  const effectiveResults =
    processedResults ??
    (dataset && lastProcessedRef.current.datasetId === dataset.id
      ? lastProcessedRef.current.results
      : null);

  // Get fieldCounts and rows from processed results
  const fieldCounts = effectiveResults?.fieldCounts || EMPTY_FIELD_COUNTS;
  const rows = (effectiveResults as any)?.hits?.hits || EMPTY_HITS;
  const prevColumns = useRef(columns);
  const dispatch = useDispatch();

  useEffect(() => {
    const timeFieldname = dataset?.timeFieldName;

    if (columns !== prevColumns.current) {
      let updatedColumns = buildColumns(columns);
      if (
        columns &&
        timeFieldname &&
        !prevColumns.current.includes(timeFieldname) &&
        columns.includes(timeFieldname)
      ) {
        // Remove timeFieldname from columns if previously chosen columns does not include time field
        updatedColumns = columns.filter((column: string) => column !== timeFieldname);
      }
      // Update the ref with the new columns
      dispatch(setColumns(updatedColumns));
      prevColumns.current = columns;
    }
  }, [columns, dispatch, dataset?.timeFieldName]);

  const isEnhancementsEnabledOverride = uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED);

  const onAddField = useCallback(
    (fieldName: string) => {
      dispatch(addColumn({ column: fieldName }));
    },
    [dispatch]
  );
  const onRemoveField = useCallback(
    (fieldName: string) => {
      dispatch(removeColumn(fieldName));
    },
    [dispatch]
  );
  const onReorderFields = useCallback(
    (source: number, destination: number) => {
      const columnName = columns[source];
      dispatch(
        moveColumn({
          columnName,
          destination,
        })
      );
    },
    [dispatch, columns]
  );

  return (
    <DiscoverSidebar
      columns={columns || EMPTY_COLUMNS}
      fieldCounts={fieldCounts as Record<string, number>}
      hits={rows}
      onAddField={onAddField}
      onRemoveField={onRemoveField}
      onReorderFields={onReorderFields}
      selectedDataSet={dataset}
      onAddFilter={onAddFilter}
      onCollapse={collapsePanel}
      isEnhancementsEnabledOverride={isEnhancementsEnabledOverride}
    />
  );
}
