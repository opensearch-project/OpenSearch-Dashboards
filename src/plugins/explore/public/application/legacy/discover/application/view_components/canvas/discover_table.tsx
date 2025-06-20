/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { IndexPatternField } from '../../../../../../../../data/public';
import {
  addColumn,
  removeColumn,
  moveColumn,
  setSort,
} from '../../../../../utils/state_management/slices/legacy_slice';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';
import { SortOrder } from '../../../../../../types/saved_explore_types';
import {
  beginTransaction,
  finishTransaction,
} from '../../../../../utils/state_management/actions/transaction_actions';
import {
  DEFAULT_COLUMNS_SETTING,
  MODIFY_COLUMNS_ON_SWITCH,
} from '../../../../../../../common/legacy/discover';
import { ExploreServices } from '../../../../../../types';
import { DataGridTable } from '../../components/data_grid/data_grid_table';
import { popularizeField } from '../../helpers/popularize_field';
import { filterColumns } from '../utils/filter_columns';
import { ResultStatus } from '../utils';

interface Props {
  scrollToTop?: () => void;
  cacheKey?: string;
  results?: any;
}

export const DiscoverTable = ({ scrollToTop, cacheKey, results: passedResults }: Props) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, capabilities } = services;
  const indexPatterns = services.data?.indexPatterns;

  // Always call useSelector hooks at the top level
  const reduxRows = useSelector((state: any) => {
    // Fallback to Redux for backward compatibility
    const queryState = state.query;
    const resultsState = state.results;

    // Get current time range from services context instead of Redux
    const timeRange = services?.data?.query?.timefilter?.timefilter?.getTime() || {
      from: 'now-15m',
      to: 'now',
    };

    // Create cache key using raw query (this is the old behavior)
    const fallbackCacheKey = `${queryState.query.query}_${timeRange.from}_${timeRange.to}`;

    // Get results from cache
    const results = resultsState[fallbackCacheKey];

    if (results?.hits?.hits) {
      return results.hits.hits;
    }
    return [];
  });

  const isLoading = useSelector((state: any) => state.ui.status === ResultStatus.LOADING);
  const reduxIndexPattern = useSelector((state: any) => {
    return state.query.dataset;
  });

  // Get data from props if provided, otherwise from Redux
  const rows = passedResults?.hits?.hits || reduxRows;

  // Get index pattern from props or Redux
  const indexPattern = passedResults?.indexPattern || reduxIndexPattern;

  const savedSearch = useSelector((state: any) => state.legacy?.savedSearch);

  // Get columns and sort from Redux
  const columns = useSelector((state: any) => {
    return state.legacy?.columns || [];
  });

  const filteredColumns = useMemo(() => {
    return filterColumns(
      columns,
      indexPattern,
      uiSettings.get(DEFAULT_COLUMNS_SETTING),
      uiSettings.get(MODIFY_COLUMNS_ON_SWITCH)
    );
  }, [columns, indexPattern, uiSettings]);

  const sort = useSelector((state: any) => {
    return state.legacy?.sort || [];
  });

  const dispatch = useDispatch();

  const onAddColumn = (col: string) => {
    if (indexPattern && capabilities.discover?.save && indexPatterns) {
      popularizeField(indexPattern, col, indexPatterns);
    }

    dispatch(addColumn({ column: col }));
  };

  const onRemoveColumn = (col: string) => {
    if (indexPattern && capabilities.discover?.save && indexPatterns) {
      popularizeField(indexPattern, col, indexPatterns);
    }

    dispatch(removeColumn(col));
  };

  const onMoveColumn = (col: string, destination: number) => {
    if (indexPattern && capabilities.discover?.save && indexPatterns) {
      popularizeField(indexPattern, col, indexPatterns);
    }
    dispatch(moveColumn({ columnName: col, destination }));
  };

  const onSetSort = (sortOrders: SortOrder[]) => {
    // Convert SortOrder[] to the format expected by the legacy_slice
    const convertedSort = sortOrders.map(([columnName, direction]) => ({
      columnName,
      direction,
    }));

    // Use transaction to batch state updates
    dispatch(beginTransaction());
    dispatch(setSort(convertedSort));
    dispatch(finishTransaction());
  };

  // Add onFilter function
  const onAddFilter = useCallback(
    (field: string | IndexPatternField, values: string, operation: '+' | '-') => {
      if (!indexPattern) return;

      // Since we're removing FilterManager, this is a no-op
      // In a real implementation, we would dispatch an action to update the query
      // Filter operation not supported in Explore
      return;
    },
    [indexPattern]
  );

  if (indexPattern === undefined) {
    return null;
  }

  if (isLoading && (!rows || rows.length === 0)) {
    return <div>{'loading...'}</div>;
  }

  // Error handling moved to toast notifications via data.search.showError

  if (!rows || rows.length === 0) {
    return <div>{'No results found'}</div>;
  }

  return (
    <DataGridTable
      columns={filteredColumns}
      indexPattern={indexPattern}
      onAddColumn={onAddColumn}
      onMoveColumn={onMoveColumn}
      onRemoveColumn={onRemoveColumn}
      onSort={onSetSort}
      onFilter={onAddFilter as DocViewFilterFn}
      sort={sort}
      rows={rows}
      title={savedSearch?.id ? savedSearch.title : ''}
      description={savedSearch?.id ? savedSearch.description : ''}
      scrollToTop={scrollToTop}
    />
  );
};
