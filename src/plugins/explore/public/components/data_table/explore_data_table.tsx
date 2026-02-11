/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './explore_data_table.scss';

import { i18n } from '@osd/i18n';
import React, { useCallback, useMemo, useRef, memo } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { ExploreFlavor, SAMPLE_SIZE_SETTING } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { UI_SETTINGS } from '../../../../data/public';
import { DocViewFilterFn } from '../../types/doc_views_types';
import { DataTable } from './data_table';
import { getDocViewsRegistry } from '../../application/legacy/discover/opensearch_dashboards_services';
import { ExploreServices } from '../../types';
import {
  selectSavedSearch,
  selectWrapCellText,
} from '../../application/utils/state_management/selectors';
import { RootState } from '../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import { useChangeQueryEditor } from '../../application/hooks';
import { useDatasetContext } from '../../application/context';
import { addColumn, removeColumn } from '../../application/utils/state_management/slices';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { useDisplayedColumns } from '../../helpers/use_displayed_columns';

const ExploreDataTableComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const { onAddFilter } = useChangeQueryEditor();
  const savedSearch = useSelector(selectSavedSearch);
  const wrapCellText = useSelector(selectWrapCellText);
  const { dataset } = useDatasetContext();

  // Get rows for the DataTable (hook handles column processing)
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const results = useSelector((state: RootState) => state.results);
  const rawResults = results[cacheKey];
  const rows = rawResults?.hits?.hits || [];

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

  // Use shared hook to ensure DataTable columns match CSV export columns
  const tableColumns = useDisplayedColumns({ includeFieldCounts: true });

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
            wrapCellText={wrapCellText}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const ExploreDataTable = memo(ExploreDataTableComponent);
