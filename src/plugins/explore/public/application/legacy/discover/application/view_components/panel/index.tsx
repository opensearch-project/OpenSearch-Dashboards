/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IndexPatternField,
  UI_SETTINGS,
  opensearchFilters,
} from '../../../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import {
  addColumn,
  removeColumn,
  moveColumn,
  setColumns,
  clearResults,
  setQueryWithHistory,
} from '../../../../../utils/state_management/slices';
import { selectColumns, selectQuery } from '../../../../../utils/state_management/selectors';
import { DiscoverSidebar } from '../../components/sidebar';
import { ExploreServices } from '../../../../../../types';
import { popularizeField } from '../../helpers/popularize_field';
import { buildColumns } from '../../utils/columns';
import { useIndexPatternContext } from '../../../../../components/index_pattern_context';
import {
  defaultResultsProcessor,
  defaultPrepareQuery,
  executeQueries,
} from '../../../../../utils/state_management/actions/query_actions';

export function DiscoverPanel() {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const {
    data: {
      query: { filterManager, queryString },
    },
    capabilities,
    application,
    uiSettings,
  } = services;

  const columns = useSelector(selectColumns);
  const query = useSelector(selectQuery);
  const results = useSelector((state: any) => state.results);
  const cacheKey = useMemo(
    () => defaultPrepareQuery(typeof query.query === 'string' ? query.query : ''),
    [query]
  );
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

  const onAddFilter = useCallback(
    (field: string | IndexPatternField, values: string, operation: '+' | '-') => {
      if (!indexPattern) return;

      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        indexPattern.id ?? ''
      );
      const languageConfig = queryString.getLanguageService().getLanguage(query.language);
      const newQuery = languageConfig?.insertFiltersToQuery?.(query, newFilters);
      if (newQuery) {
        dispatch(setQueryWithHistory(newQuery));
        dispatch(clearResults());
        dispatch(executeQueries({ services }));
      }
    },
    [filterManager, indexPattern, query, queryString, dispatch, services]
  );

  const onCreateIndexPattern = useCallback(async () => {
    if (!indexPattern?.title) return;
    application?.navigateToApp('management', {
      path: `opensearch-dashboards/indexPatterns/create?id=${indexPattern.title}`,
    });
  }, [application, indexPattern?.title]);

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
      onCreateIndexPattern={onCreateIndexPattern}
      onAddFilter={onAddFilter}
      isEnhancementsEnabledOverride={isEnhancementsEnabledOverride}
    />
  );
}
