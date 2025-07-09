/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef, memo, useState, useEffect } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import {
  DEFAULT_COLUMNS_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
  MODIFY_COLUMNS_ON_SWITCH,
  SAMPLE_SIZE_SETTING,
} from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { UI_SETTINGS } from '../../../../data/public';
import { DocViewFilterFn } from '../../types/doc_views_types';
import { DataTable } from './data_table';
import {
  useDispatch,
  useSelector,
} from '../../application/legacy/discover/application/utils/state_management';
import { popularizeField } from '../../application/legacy/discover/application/helpers/popularize_field';
import { buildColumns } from '../../application/legacy/discover/application/utils/columns';
import { filterColumns } from '../../application/legacy/discover/application/view_components/utils/filter_columns';
import { getLegacyDisplayedColumns } from '../../helpers/data_table_helper';
import { getDocViewsRegistry } from '../../application/legacy/discover/opensearch_dashboards_services';
import { ExploreServices } from '../../types';
import {
  selectColumns,
  selectSavedSearch,
} from '../../application/utils/state_management/selectors';
import { RootState } from '../../application/utils/state_management/store';
import { useIndexPatternContext } from '../../application/components/index_pattern_context';
import { addColumn, removeColumn } from '../../application/utils/state_management/slices';
import { defaultPrepareQuery } from '../../application/utils/state_management/actions/query_actions';
import { SaveAndAddButtonWithModal } from '.././visualizations/add_to_dashboard_button';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { useChangeQueryEditor } from '../../application/hooks';

const ExploreDataTableComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, data, capabilities, indexPatterns } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const savedSearch = useSelector(selectSavedSearch);
  const columns = useSelector(selectColumns);
  const { indexPattern } = useIndexPatternContext();

  const results = useSelector((state: RootState) => state.results);

  // Use default cache key computation for this component
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(
    () => defaultPrepareQuery(typeof query.query === 'string' ? query.query : ''),
    [query]
  );

  const rawResults = cacheKey ? results[cacheKey] : null;
  const rows = rawResults?.hits?.hits || [];

  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: data.query.queryString.getQuery(),
    filters: data.query.filterManager.getFilters(),
    timeRange: data.query.timefilter.timefilter.getTime(),
  });

  useEffect(() => {
    const subscription = services.data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [services.data.query.state$]);

  const tableColumns = useMemo(() => {
    if (indexPattern == null) {
      return [];
    }

    const filteredColumns = filterColumns(
      columns,
      indexPattern,
      uiSettings.get(DEFAULT_COLUMNS_SETTING),
      uiSettings.get(MODIFY_COLUMNS_ON_SWITCH)
    );

    let adjustedColumns = buildColumns(filteredColumns);
    // Handle the case where all fields/columns are removed except the time-field one
    if (adjustedColumns.length === 1 && adjustedColumns[0] === indexPattern.timeFieldName) {
      adjustedColumns = [...adjustedColumns, '_source'];
    }

    const displayedColumns = getLegacyDisplayedColumns(
      adjustedColumns,
      indexPattern,
      uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
      uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING)
    );

    return displayedColumns;
  }, [columns, indexPattern, uiSettings]);

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  const docViewsRegistry = useMemo(() => getDocViewsRegistry(), []);

  const dispatch = useDispatch();
  const onAddColumn = useCallback(
    (col: string) => {
      if (indexPattern && capabilities.discover?.save) {
        popularizeField(indexPattern, col, indexPatterns);
      }

      dispatch(addColumn({ column: col }));
    },
    [indexPattern, capabilities.discover?.save, indexPatterns, dispatch]
  );

  const onRemoveColumn = useCallback(
    (col: string) => {
      if (indexPattern && capabilities.discover?.save) {
        popularizeField(indexPattern, col, indexPatterns);
      }

      dispatch(removeColumn(col));
    },
    [indexPattern, capabilities.discover?.save, indexPatterns, dispatch]
  );

  return (
    <div
      data-render-complete={true}
      data-shared-item=""
      data-title={savedSearch || ''}
      data-description={savedSearch || ''}
      data-test-subj="discoverTable"
      className="eui-xScrollWithShadows"
      style={{ height: '100%' }}
      ref={containerRef}
    >
      <EuiFlexGroup direction="column" gutterSize="xs" justifyContent="center">
        <EuiFlexItem>
          <EuiSpacer size="s" />
        </EuiFlexItem>
        <EuiFlexItem style={{ alignSelf: 'flex-end' }}>
          <SaveAndAddButtonWithModal
            searchContext={searchContext}
            indexPattern={indexPattern}
            services={services}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <DataTable
            columns={tableColumns}
            indexPattern={indexPattern}
            rows={rows}
            docViewsRegistry={docViewsRegistry}
            sampleSize={uiSettings.get(SAMPLE_SIZE_SETTING)}
            isShortDots={uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE)}
            onAddColumn={onAddColumn}
            onFilter={onAddFilter as DocViewFilterFn}
            onRemoveColumn={onRemoveColumn}
            scrollToTop={scrollToTop}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const ExploreDataTable = memo(ExploreDataTableComponent);
