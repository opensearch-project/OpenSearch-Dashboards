/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { UI_SETTINGS } from '../../../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import {
  addColumn,
  removeColumn,
  moveColumn,
  setColumns,
} from '../../../../../utils/state_management/slices';
import { selectColumns, selectQuery } from '../../../../../utils/state_management/selectors';
import { DiscoverSidebar } from '../../components/sidebar';
import { ExploreServices } from '../../../../../../types';
import { popularizeField } from '../../helpers/popularize_field';
import { buildColumns } from '../../utils/columns';
import { useIndexPatternContext } from '../../../../../components/index_pattern_context';
import {
  defaultResultsProcessor,
  defaultPrepareQueryString,
} from '../../../../../utils/state_management/actions/query_actions';
import { useChangeQueryEditor } from '../../../../../hooks';

export function DiscoverPanel() {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { capabilities, uiSettings } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const columns = useSelector(selectColumns);
  const query = useSelector(selectQuery);
  const results = useSelector((state: any) => state.results);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const rawResults = cacheKey ? results[cacheKey] : null;
  const { indexPattern } = useIndexPatternContext();

  // Process raw results to get field counts and rows
  const processedResults = useMemo(() => {
    if (!rawResults || !indexPattern) {
      return null;
    }

    // Use defaultResultsProcessor without histogram (DiscoverPanel doesn't need chart data)
    const processed = defaultResultsProcessor(rawResults, indexPattern);
    return processed;
  }, [rawResults, indexPattern]);

  // Get fieldCounts and rows from processed results
  const fieldCounts = processedResults?.fieldCounts || {};
  const rows = (processedResults as any)?.hits?.hits || [];
  const prevColumns = useRef(columns);
  const dispatch = useDispatch();

  useEffect(() => {
    const timeFieldname = indexPattern?.timeFieldName;

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
  }, [columns, dispatch, indexPattern?.timeFieldName]);

  const isEnhancementsEnabledOverride = uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED);

  return (
    <DiscoverSidebar
      columns={columns || []}
      fieldCounts={(fieldCounts as any) || {}}
      hits={rows || []}
      onAddField={(fieldName, index) => {
        if (indexPattern && capabilities.discover?.save) {
          popularizeField(indexPattern, fieldName, services.data.indexPatterns);
        }
        dispatch(addColumn({ column: fieldName }));
      }}
      onRemoveField={(fieldName) => {
        if (indexPattern && capabilities.discover?.save) {
          popularizeField(indexPattern, fieldName, services.data.indexPatterns);
        }
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
      selectedIndexPattern={indexPattern}
      onAddFilter={onAddFilter}
      isEnhancementsEnabledOverride={isEnhancementsEnabledOverride}
    />
  );
}
