/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PersistedState } from '../../../visualizations/public';
import { TableUiState, getTableUIState } from './get_table_ui_state';
import { ColumnWidth, ColumnSort } from '../types';

describe('getTableUIState', () => {
  let uiState: PersistedState;
  let tableUiState: TableUiState;

  beforeEach(() => {
    uiState = ({
      get: jest.fn(),
      set: jest.fn(),
      emit: jest.fn(),
    } as unknown) as PersistedState;
    tableUiState = getTableUIState(uiState);
  });

  it('should get initial sort and width values from uiState', () => {
    const initialSort: ColumnSort = { colIndex: 1, direction: 'asc' };
    const initialWidth: ColumnWidth[] = [{ colIndex: 0, width: 100 }];

    (uiState.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'vis.sortColumn') return initialSort;
      if (key === 'vis.columnsWidth') return initialWidth;
    });

    const newTableUiState = getTableUIState(uiState);
    expect(newTableUiState.sort).toEqual(initialSort);
    expect(newTableUiState.colWidth).toEqual(initialWidth);
  });

  it('should set and emit sort values', () => {
    const newSort: ColumnSort = { colIndex: 2, direction: 'desc' };
    tableUiState.setSort(newSort);

    expect(uiState.set).toHaveBeenCalledWith('vis.sortColumn', newSort);
    expect(uiState.emit).toHaveBeenCalledWith('reload');
  });

  it('should set and emit width values for a new column', () => {
    const newWidth: ColumnWidth = { colIndex: 1, width: 150 };
    tableUiState.setWidth(newWidth);

    expect(uiState.set).toHaveBeenCalledWith('vis.columnsWidth', [newWidth]);
    expect(uiState.emit).toHaveBeenCalledWith('reload');
  });

  it('should update and emit width values for an existing column', () => {
    const initialWidth: ColumnWidth[] = [{ colIndex: 0, width: 100 }];
    (uiState.get as jest.Mock).mockReturnValue(initialWidth);

    const updatedTableUiState = getTableUIState(uiState);

    const updatedWidth: ColumnWidth = { colIndex: 0, width: 150 };
    updatedTableUiState.setWidth(updatedWidth);

    const expectedWidths = [{ colIndex: 0, width: 150 }];
    expect(uiState.set).toHaveBeenCalledWith('vis.columnsWidth', expectedWidths);
    expect(uiState.emit).toHaveBeenCalledWith('reload');
  });
});
