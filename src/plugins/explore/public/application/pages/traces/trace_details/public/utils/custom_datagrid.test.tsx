/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { RenderCustomDataGrid } from './custom_datagrid';

describe('RenderCustomDataGrid', () => {
  const mockColumns = [
    { id: 'col1', display: 'Column 1' },
    { id: 'col2', display: 'Column 2' },
    { id: 'attributes.col3', display: 'Column 3' },
  ];

  const mockRenderCellValue = ({ rowIndex, columnId }: { rowIndex: number; columnId: string }) => {
    return `${columnId}-${rowIndex}`;
  };

  const defaultProps = {
    columns: mockColumns,
    renderCellValue: mockRenderCellValue,
    rowCount: 10,
  };

  const getDataGrid = () => screen.getByTestId('custom-data-grid');
  const getLoadingSpinner = () => screen.queryByTestId('loadingSpinner');

  it('renders with minimum required props', () => {
    render(<RenderCustomDataGrid {...defaultProps} />);
    expect(getDataGrid()).toBeInTheDocument();
  });

  it('filters out attributes and instrumentation columns by default', () => {
    render(<RenderCustomDataGrid {...defaultProps} />);
    const grid = getDataGrid();
    expect(grid).toBeInTheDocument();

    expect(grid).toHaveClass('euiDataGrid');
  });

  it('shows loading spinner when isTableDataLoading is true', () => {
    render(<RenderCustomDataGrid {...defaultProps} isTableDataLoading={true} />);
    const spinner = getLoadingSpinner();
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('euiLoadingSpinner');
  });
});
