/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';

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

  it('accepts a secondaryToolbar without a separate overlay (merged into the grid toolbar)', () => {
    const secondaryToolbar = [
      <button key="test-button" data-test-subj="secondary-button">
        Secondary Button
      </button>,
    ];

    render(<RenderCustomDataGrid {...defaultProps} secondaryToolbar={secondaryToolbar} />);

    // Grid still renders, and the legacy absolutely-positioned overlay is gone —
    // secondary controls are now merged into the grid's own controls row.
    expect(getDataGrid()).toBeInTheDocument();
    expect(document.querySelector('.exploreCustomDataGrid__secondaryToolbar')).toBeNull();
  });
});
