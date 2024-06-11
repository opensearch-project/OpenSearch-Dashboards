/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_data_grid_table.scss';

import React, { useMemo, useCallback } from 'react';
import { EuiDataGrid, EuiDataGridSorting } from '@elastic/eui';
import { IndexPattern, getServices } from '../../../opensearch_dashboards_services';
import { fetchTableDataCell } from './data_grid_table_cell_value';
import { buildDataGridColumns, computeVisibleColumns } from './data_grid_table_columns';
import { DocViewInspectButton } from './data_grid_table_docview_inspect_button';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { usePagination } from '../utils/use_pagination';
import { buildColumns } from '../../utils/columns';
import { DOC_HIDE_TIME_COLUMN_SETTING, SAMPLE_SIZE_SETTING } from '../../../../common';
import { UI_SETTINGS } from '../../../../../data/common';
import { SortOrder } from '../../../saved_searches/types';
import { useToolbarOptions } from './data_grid_toolbar';

export interface DataGridProps {
  columns: string[];
  indexPattern: IndexPattern;
  onSort: (s: SortOrder[]) => void;
  rows: OpenSearchSearchHit[];
  onSetColumns: (columns: string[]) => void;
  sort: SortOrder[];
  isToolbarVisible?: boolean;
  isContextView?: boolean;
}

const DataGridUI = ({
  columns,
  indexPattern,
  onSetColumns,
  onSort,
  sort,
  rows,
  isToolbarVisible = true,
  isContextView = false,
}: DataGridProps) => {
  const services = getServices();
  const rowCount = useMemo(() => (rows ? rows.length : 0), [rows]);
  const { toolbarOptions, lineCount } = useToolbarOptions();
  const [pageSizeLimit, isShortDots] = useMemo(() => {
    return [
      services.uiSettings.get(SAMPLE_SIZE_SETTING),
      services.uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
    ];
  }, [services.uiSettings]);
  const displayTimeColumn = useMemo(
    () =>
      !services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false) && indexPattern?.isTimeBased(),
    [indexPattern, services.uiSettings]
  );
  const pagination = usePagination({ rowCount, pageSizeLimit });

  let adjustedColumns = buildColumns(columns);
  // handle case where the user removes selected filed and leaves only time column
  if (
    adjustedColumns.length === 1 &&
    indexPattern &&
    adjustedColumns[0] === indexPattern.timeFieldName
  ) {
    adjustedColumns = [...adjustedColumns, '_source'];
  }

  const includeSourceInColumns = adjustedColumns.includes('_source');
  const sortingColumns = useMemo(() => sort.map(([id, direction]) => ({ id, direction })), [sort]);
  const rowHeightsOptions = useMemo(
    () => ({
      defaultHeight: {
        lineCount: lineCount || (includeSourceInColumns ? 3 : 1),
      },
    }),
    [includeSourceInColumns, lineCount]
  );

  const onColumnSort = useCallback(
    (cols: EuiDataGridSorting['columns']) => {
      onSort(cols.map(({ id, direction }) => [id, direction]));
    },
    [onSort]
  );

  const renderCellValue = useMemo(() => fetchTableDataCell(indexPattern, rows, isShortDots), [
    indexPattern,
    isShortDots,
    rows,
  ]);

  const displayedTableColumns = useMemo(
    () =>
      buildDataGridColumns(
        adjustedColumns,
        indexPattern,
        displayTimeColumn,
        includeSourceInColumns,
        isContextView
      ),
    [adjustedColumns, indexPattern, displayTimeColumn, includeSourceInColumns, isContextView]
  );

  const dataGridTableColumnsVisibility = useMemo(
    () => ({
      visibleColumns: computeVisibleColumns(
        adjustedColumns,
        indexPattern,
        displayTimeColumn
      ) as string[],
      setVisibleColumns: (cols: string[]) => {
        onSetColumns(cols);
      },
    }),
    [adjustedColumns, indexPattern, displayTimeColumn, onSetColumns]
  );

  const sorting: EuiDataGridSorting = useMemo(
    () => ({ columns: sortingColumns, onSort: onColumnSort }),
    [sortingColumns, onColumnSort]
  );

  const leadingControlColumns = useMemo(() => {
    return [
      {
        id: 'inspectCollapseColumn',
        headerCellRender: () => null,
        rowCellRender: DocViewInspectButton,
        width: 40,
      },
    ];
  }, []);

  return (
    <EuiDataGrid
      aria-labelledby="aria-labelledby"
      columns={displayedTableColumns}
      columnVisibility={dataGridTableColumnsVisibility}
      leadingControlColumns={leadingControlColumns}
      data-test-subj="docTable"
      pagination={pagination}
      renderCellValue={renderCellValue}
      rowCount={rowCount}
      sorting={sorting}
      toolbarVisibility={isToolbarVisible ? toolbarOptions : false}
      rowHeightsOptions={rowHeightsOptions}
      className="discoverDataGrid"
    />
  );
};

export const DataGrid = React.memo(DataGridUI);
