/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiDataGridColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IndexPattern } from '../../../opensearch_dashboards_services';

export function buildDataGridColumns(
  columnNames: string[],
  idxPattern: IndexPattern,
  displayTimeColumn: boolean
) {
  const timeFieldName = idxPattern.timeFieldName;
  let columnsToUse = columnNames;

  if (displayTimeColumn && idxPattern.timeFieldName && !columnNames.includes(timeFieldName)) {
    columnsToUse = [idxPattern.timeFieldName, ...columnNames];
  }

  return columnsToUse.map((colName) => generateDataGridTableColumn(colName, idxPattern));
}

export function generateDataGridTableColumn(colName: string, idxPattern: IndexPattern) {
  const timeLabel = i18n.translate('discover.timeLabel', {
    defaultMessage: 'Time',
  });
  const idxPatternField = idxPattern.getFieldByName(colName);
  const dataGridCol: EuiDataGridColumn = {
    id: colName,
    schema: idxPatternField?.type,
    isSortable: idxPatternField?.sortable,
    display: idxPatternField?.displayName,
    actions: {
      showHide: true,
      showMoveLeft: false,
      showMoveRight: false,
    },
    cellActions: [],
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
