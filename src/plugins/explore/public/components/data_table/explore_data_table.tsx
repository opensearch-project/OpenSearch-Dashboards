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
import { useSelector } from '../../application/legacy/discover/application/utils/state_management';
import { filterColumns } from '../../application/legacy/discover/application/view_components/utils/filter_columns';
import { getLegacyDisplayedColumns } from '../../helpers/data_table_helper';
import { getDocViewsRegistry } from '../../application/legacy/discover/opensearch_dashboards_services';
import { ExploreServices } from '../../types';
import { selectSavedSearch } from '../../application/utils/state_management/selectors';
import { RootState } from '../../application/utils/state_management/store';
import {
  defaultPrepareQueryString,
  defaultResultsProcessor,
} from '../../application/utils/state_management/actions/query_actions';
import { SaveAndAddButtonWithModal } from '.././visualizations/add_to_dashboard_button';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { useChangeQueryEditor } from '../../application/hooks';
import { useDatasetContext } from '../../application/context';

const ExploreDataTableComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, data } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const savedSearch = useSelector(selectSavedSearch);
  const { dataset } = useDatasetContext();

  const results = useSelector((state: RootState) => state.results);

  // Use default cache key computation for this component
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);

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

  // Process raw results to get field counts and rows
  const processedResults = useMemo(() => {
    if (!rawResults || !dataset) {
      return null;
    }

    // Use defaultResultsProcessor without histogram (DiscoverPanel doesn't need chart data)
    const processed = defaultResultsProcessor(rawResults, dataset);
    return processed;
  }, [rawResults, dataset]);

  const tableColumns = useMemo(() => {
    if (dataset == null) {
      return [];
    }

    let filteredColumns = filterColumns(
      dataset,
      uiSettings.get(DEFAULT_COLUMNS_SETTING),
      uiSettings.get(MODIFY_COLUMNS_ON_SWITCH),
      processedResults?.fieldCounts
    );

    // Handle the case where all fields/columns are removed except the time-field one
    if (filteredColumns.length === 1 && filteredColumns[0] === dataset.timeFieldName) {
      filteredColumns = [...filteredColumns, '_source'];
    }

    const displayedColumns = getLegacyDisplayedColumns(
      filteredColumns,
      dataset,
      uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
      uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING)
    );

    return displayedColumns;
  }, [dataset, processedResults?.fieldCounts, uiSettings]);

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  const docViewsRegistry = useMemo(() => getDocViewsRegistry(), []);

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
            dataset={dataset}
            services={services}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <DataTable
            columns={tableColumns}
            dataset={dataset!}
            rows={rows}
            docViewsRegistry={docViewsRegistry}
            sampleSize={uiSettings.get(SAMPLE_SIZE_SETTING)}
            isShortDots={uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE)}
            onFilter={onAddFilter as DocViewFilterFn}
            scrollToTop={scrollToTop}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const ExploreDataTable = memo(ExploreDataTableComponent);
