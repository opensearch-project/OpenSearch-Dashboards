/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PersistedState } from '../../../visualizations/public';
import { ColumnSort, ColumnWidth } from '../types';

export interface TableUiState {
  sort: ColumnSort;
  setSort: (sort: ColumnSort) => void;
  colWidth: ColumnWidth[];
  setWidth: (columnWidths: ColumnWidth) => void;
}

export function getTableUIState(uiState: PersistedState): TableUiState {
  const sort: ColumnSort = uiState.get('vis.sortColumn') || {};
  const colWidth: ColumnWidth[] = uiState.get('vis.columnsWidth') || [];

  const setSort = (newSort: ColumnSort) => {
    uiState.set('vis.sortColumn', newSort);
    uiState.emit('reload');
  };

  const setWidth = (columnWidth: ColumnWidth) => {
    const nextState = [...colWidth];
    const curColIndex = colWidth.findIndex((col) => col.colIndex === columnWidth.colIndex);

    if (curColIndex < 0) {
      nextState.push(columnWidth);
    } else {
      nextState[curColIndex] = columnWidth;
    }

    uiState.set('vis.columnsWidth', nextState);
    uiState.emit('reload');
  };

  return { sort, setSort, colWidth, setWidth };
}
