/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiDataGrid, EuiDataGridCellProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { UI_SETTINGS } from '../../../../data/common';
import { IPrometheusSearchResult } from '../../application/utils/state_management/slices';
import { ExploreServices } from '../../types';

export interface MetricsDataTableProps {
  searchResult?: IPrometheusSearchResult;
}

const emptyHits: NonNullable<IPrometheusSearchResult['instantHits']>['hits'] = [];

export const MetricsDataTable: React.FC<MetricsDataTableProps> = ({ searchResult }) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dateFormat = services.uiSettings.get(UI_SETTINGS.DATE_FORMAT);

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const rows = searchResult?.instantHits?.hits || emptyHits;
  const columns = useMemo(
    () =>
      searchResult?.instantFieldSchema
        ?.filter((field) => field.name !== 'Metric')
        .map((field) => ({
          id: field.name || '',
          displayAsText: field.name || '',
        })) || [],
    [searchResult]
  );

  useEffect(() => {
    setVisibleColumns(columns.map((col) => col.id));
  }, [columns]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchResult]);

  const renderCellValue: EuiDataGridCellProps['renderCellValue'] = useCallback(
    ({ rowIndex, columnId }) => {
      const hit = rows[rowIndex];
      if (!hit?._source) return '—';

      const value = hit._source[columnId];
      if (columnId === 'Time' && typeof value === 'number') {
        return moment(value).format(dateFormat);
      }
      return value ?? '—';
    },
    [rows, dateFormat]
  );

  return (
    <EuiDataGrid
      aria-label={i18n.translate('explore.metricsDataTable.ariaLabel', {
        defaultMessage: 'Metrics data table',
      })}
      columns={columns}
      columnVisibility={{ visibleColumns, setVisibleColumns }}
      rowCount={rows.length}
      renderCellValue={renderCellValue}
      pagination={{
        ...pagination,
        pageSizeOptions: [25, 50, 100],
        onChangePage: (pageIndex: number) => setPagination((prev) => ({ ...prev, pageIndex })),
        onChangeItemsPerPage: (pageSize: number) => setPagination({ pageIndex: 0, pageSize }),
      }}
    />
  );
};
