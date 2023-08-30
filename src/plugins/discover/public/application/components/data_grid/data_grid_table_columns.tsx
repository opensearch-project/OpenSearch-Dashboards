/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiDataGridColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getCellActions } from './data_grid_table_cell_actions';

export function buildDataGridColumns(
  columnNames: string[],
  idxPattern: IndexPattern,
  displayTimeColumn: boolean,
  includeSourceInColumns: boolean,
  isContextView: boolean
) {
  const timeFieldName = idxPattern.timeFieldName;
  let columnsToUse = columnNames;

  if (displayTimeColumn && timeFieldName && !columnNames.includes(timeFieldName)) {
    columnsToUse = [timeFieldName, ...columnNames];
  }

  return columnsToUse.map((colName) =>
    generateDataGridTableColumn(colName, idxPattern, includeSourceInColumns, isContextView)
  );
}

export function generateDataGridTableColumn(
  colName: string,
  idxPattern: IndexPattern,
  includeSourceInColumns: boolean,
  isContextView: boolean
) {
  const timeLabel = i18n.translate('discover.timeLabel', {
    defaultMessage: 'Time',
  });
  const idxPatternField = idxPattern.getFieldByName(colName);
  const shouldHide = colName === '_source' || colName === idxPattern.timeFieldName;
  const dataGridCol: EuiDataGridColumn = {
    id: colName,
    schema: idxPatternField?.type,
    isSortable: idxPatternField?.sortable,
    display: idxPatternField?.displayName,
    actions: isContextView
      ? false
      : {
          showHide: shouldHide
            ? false
            : {
                label: i18n.translate('discover.removeColumn.label', {
                  defaultMessage: 'Remove column',
                }),
                iconType: 'cross',
              },
          showMoveLeft: !includeSourceInColumns,
          showMoveRight: !includeSourceInColumns,
        },
    cellActions: idxPatternField ? getCellActions(idxPatternField) : [],
  };

  if (dataGridCol.id === idxPattern.timeFieldName) {
    dataGridCol.display = `${timeLabel} (${idxPattern.timeFieldName})`;
    dataGridCol.initialWidth = 200;
  }
  if (dataGridCol.id === '_source') {
    dataGridCol.display = i18n.translate('discover.sourceLabel', {
      defaultMessage: 'Source',
    });
  }
  return dataGridCol;
}

export function computeVisibleColumns(
  columnNames: string[],
  idxPattern: IndexPattern,
  displayTimeColumn: boolean
) {
  const timeFieldName = idxPattern.timeFieldName;
  let visibleColumnNames = columnNames;

  if (displayTimeColumn && !columnNames.includes(timeFieldName)) {
    visibleColumnNames = [timeFieldName, ...columnNames];
  }

  return visibleColumnNames;
}
