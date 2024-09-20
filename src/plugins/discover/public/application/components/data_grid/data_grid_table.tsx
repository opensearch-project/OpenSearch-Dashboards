/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { EuiPanel } from '@elastic/eui';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../../../common';
import { IndexPattern, getServices } from '../../../opensearch_dashboards_services';
import { DataGridFlyout } from './data_grid_table_flyout';
import { DiscoverGridContextProvider } from './data_grid_table_context';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { buildColumns } from '../../utils/columns';
import { DefaultDiscoverTable } from '../default_discover_table/default_discover_table';
import { DataGrid } from './data_grid';
import { getNewDiscoverSetting } from '../utils/local_storage';
import { SortOrder } from '../../../saved_searches/types';

export interface DataGridTableProps {
  columns: string[];
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onMoveColumn: (colName: string, destination: number) => void;
  onRemoveColumn: (column: string) => void;
  hits?: number;
  onSort: (s: SortOrder[]) => void;
  rows: OpenSearchSearchHit[];
  onSetColumns: (columns: string[]) => void;
  sort: SortOrder[];
  title?: string;
  description?: string;
  isToolbarVisible?: boolean;
  isContextView?: boolean;
  isLoading?: boolean;
  showPagination?: boolean;
  scrollToTop?: () => void;
}

export const DataGridTable = ({
  columns,
  indexPattern,
  onAddColumn,
  onFilter,
  onMoveColumn,
  onRemoveColumn,
  onSetColumns,
  onSort,
  sort,
  hits,
  rows,
  title = '',
  description = '',
  isToolbarVisible = true,
  isContextView = false,
  isLoading = false,
  showPagination,
  scrollToTop,
}: DataGridTableProps) => {
  const services = getServices();
  const [inspectedHit, setInspectedHit] = useState<OpenSearchSearchHit | undefined>();

  let adjustedColumns = buildColumns(columns);
  // Handle the case where all fields/columns are removed except the time-field one
  if (
    adjustedColumns.length === 1 &&
    indexPattern &&
    adjustedColumns[0] === indexPattern.timeFieldName
  ) {
    adjustedColumns = [...adjustedColumns, '_source'];
  }

  const newDiscoverEnabled = getNewDiscoverSetting(services.storage);
  const isQueryEnhancementEnabled = services.uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);

  const panelContent =
    isQueryEnhancementEnabled || !newDiscoverEnabled ? (
      <DefaultDiscoverTable
        columns={adjustedColumns}
        indexPattern={indexPattern}
        sort={sort}
        onSort={onSort}
        rows={rows}
        hits={hits}
        onAddColumn={onAddColumn}
        onMoveColumn={onMoveColumn}
        onRemoveColumn={onRemoveColumn}
        onFilter={onFilter}
        onClose={() => setInspectedHit(undefined)}
        showPagination={showPagination}
        scrollToTop={scrollToTop}
      />
    ) : (
      <DataGrid
        columns={columns}
        indexPattern={indexPattern}
        sort={sort}
        onSort={onSort}
        rows={rows}
        onSetColumns={onSetColumns}
        isToolbarVisible={isToolbarVisible}
        isContextView={isContextView}
      />
    );

  const tablePanelProps = {
    paddingSize: 'none' as const,
    style: {
      margin: newDiscoverEnabled ? '8px' : '0px',
    },
    color: 'transparent' as const,
  };

  return (
    <DiscoverGridContextProvider
      value={{
        inspectedHit,
        onFilter,
        setInspectedHit,
        rows: rows || [],
        indexPattern,
      }}
    >
      <div
        data-render-complete={!isLoading}
        data-shared-item=""
        data-title={title}
        data-description={description}
        data-test-subj="discoverTable"
        className="eui-xScrollWithShadows"
      >
        <EuiPanel hasBorder={false} hasShadow={false} {...tablePanelProps}>
          {panelContent}
        </EuiPanel>
        {newDiscoverEnabled && inspectedHit && (
          <DataGridFlyout
            indexPattern={indexPattern}
            hit={inspectedHit}
            columns={adjustedColumns}
            onRemoveColumn={onRemoveColumn}
            onAddColumn={onAddColumn}
            onFilter={onFilter}
            onClose={() => setInspectedHit(undefined)}
          />
        )}
      </div>
    </DiscoverGridContextProvider>
  );
};
