/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './explore_data_table.scss';

import { i18n } from '@osd/i18n';
import React, { useCallback, useMemo, useRef, memo } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import {
  DEFAULT_COLUMNS_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
  ExploreFlavor,
  MODIFY_COLUMNS_ON_SWITCH,
  SAMPLE_SIZE_SETTING,
} from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { UI_SETTINGS } from '../../../../data/public';
import { DocViewFilterFn } from '../../types/doc_views_types';
import { DataTable } from './data_table';
import { filterColumns } from '../../helpers/view_component_utils/filter_columns';
import { getLegacyDisplayedColumns } from '../../helpers/data_table_helper';
import { getDocViewsRegistry } from '../../application/legacy/discover/opensearch_dashboards_services';
import { ExploreServices } from '../../types';
import {
  selectColumns,
  selectSavedSearch,
} from '../../application/utils/state_management/selectors';
import { RootState } from '../../application/utils/state_management/store';
import {
  defaultResultsProcessor,
  defaultPrepareQueryString,
} from '../../application/utils/state_management/actions/query_actions';
import { useChangeQueryEditor } from '../../application/hooks';
import { useDatasetContext } from '../../application/context';
import { addColumn, removeColumn } from '../../application/utils/state_management/slices';
import { useFlavorId } from '../../helpers/use_flavor_id';

const ExploreDataTableComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const savedSearch = useSelector(selectSavedSearch);
  const columns = useSelector(selectColumns);
  const { dataset } = useDatasetContext();

  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const results = useSelector((state: RootState) => state.results);
  const rawResults = results[cacheKey];
  const rows = rawResults?.hits?.hits || [];

  // Process raw results to get field counts and rows
  const processedResults = useMemo(() => {
    if (!rawResults || !dataset) {
      return null;
    }

    // Use defaultResultsProcessor without histogram (DiscoverPanel doesn't need chart data)
    const processed = defaultResultsProcessor(rawResults, dataset);
    return processed;
  }, [rawResults, dataset]);

  const flavorId = useFlavorId();
  const expandedTableHeader = useMemo(() => {
    if (flavorId === ExploreFlavor.Traces) {
      return i18n.translate('explore.dataTable.expandedRow.spanHeading', {
        defaultMessage: 'Expanded span',
      });
    }
    return i18n.translate('explore.dataTable.expandedRow.documentHeading', {
      defaultMessage: 'Expanded document',
    });
  }, [flavorId]);

  const tableColumns = useMemo(() => {
    if (dataset == null) {
      return [];
    }

    let filteredColumns = filterColumns(
      columns,
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
  }, [columns, dataset, processedResults?.fieldCounts, uiSettings]);

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
      dispatch(addColumn({ column: col }));
    },
    [dispatch]
  );

  const onRemoveColumn = useCallback(
    (col: string) => {
      dispatch(removeColumn(col));
    },
    [dispatch]
  );

  return (
    <div
      data-render-complete={true}
      data-shared-item=""
      data-title={savedSearch || ''}
      data-description={savedSearch || ''}
      data-test-subj="discoverTable"
      className="explore-table-container eui-xScrollWithShadows"
      ref={containerRef}
    >
      <EuiFlexGroup
        direction="column"
        gutterSize="xs"
        justifyContent="center"
        className="explore-table-flex-group"
      >
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
            onAddColumn={onAddColumn}
            onRemoveColumn={onRemoveColumn}
            expandedTableHeader={expandedTableHeader}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const ExploreDataTable = memo(ExploreDataTableComponent);
