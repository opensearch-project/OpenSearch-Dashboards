/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useMemo } from 'react';
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
import { useChangeQueryEditor } from '../../application/hooks';

export interface IDiscoverPanelProps {
  collapsePanel?: () => void;
}

export function DiscoverPanel({ collapsePanel }: IDiscoverPanelProps) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const columns = useSelector(selectColumns);
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

  return (
    <DiscoverSidebar
      columns={columns || []}
      fieldCounts={(fieldCounts as any) || {}}
      hits={rows || []}
      onAddField={(fieldName) => {
        dispatch(addColumn({ column: fieldName }));
      }}
      onRemoveField={(fieldName) => {
        dispatch(removeColumn(fieldName));
      }}
      onReorderFields={(source, destination) => {
        const columnName = columns[source];
        dispatch(
          moveColumn({
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
