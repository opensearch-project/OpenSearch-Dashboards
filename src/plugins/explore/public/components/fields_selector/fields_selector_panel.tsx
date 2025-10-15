/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { UI_SETTINGS } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  selectQuery,
  selectVisibleColumnNames,
} from '../../application/utils/state_management/selectors';
import { DiscoverSidebar } from '.';
import { ExploreServices } from '../../types';
import { useDatasetContext } from '../../application/context';
import {
  defaultResultsProcessor,
  defaultPrepareQueryString,
} from '../../application/utils/state_management/actions/query_actions';
import { useChangeQueryEditor } from '../../application/hooks';
import { moveVisibleColumnName } from '../../application/utils/state_management/slices';
import {
  addVisibleColumnName,
  removeVisibleColumnName,
} from '../../application/utils/state_management/actions/columns';

export interface IDiscoverPanelProps {
  collapsePanel?: () => void;
}

export function DiscoverPanel({ collapsePanel }: IDiscoverPanelProps) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const columns = useSelector(selectVisibleColumnNames);
  const query = useSelector(selectQuery);
  const results = useSelector((state: any) => state.results);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const rawResults = cacheKey ? results[cacheKey] : null;
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

  // Get fieldCounts and rows from processed results
  const fieldCounts = processedResults?.fieldCounts || {};
  const rows = (processedResults as any)?.hits?.hits || [];
  const dispatch = useDispatch();

  const isEnhancementsEnabledOverride = uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED);

  return (
    <DiscoverSidebar
      columns={columns || []}
      fieldCounts={(fieldCounts as any) || {}}
      hits={rows || []}
      onAddField={(fieldName) => {
        dispatch(addVisibleColumnName(fieldName));
      }}
      onRemoveField={(fieldName) => {
        dispatch(removeVisibleColumnName(fieldName));
      }}
      onReorderFields={(source, destination) => {
        const columnName = columns[source];
        dispatch(
          moveVisibleColumnName({
            columnName,
            destination,
          })
        );
      }}
      selectedDataSet={dataset}
      onAddFilter={onAddFilter}
      onCollapse={collapsePanel}
      isEnhancementsEnabledOverride={isEnhancementsEnabledOverride}
    />
  );
}
