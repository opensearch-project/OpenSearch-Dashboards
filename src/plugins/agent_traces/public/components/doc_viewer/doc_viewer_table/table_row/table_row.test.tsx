/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocViewTableRow } from './table_row';

// Mock child components
jest.mock('./table_row_btn_filter_add', () => ({
  DocViewTableRowBtnFilterAdd: ({ onClick, disabled }: any) => (
    <button data-test-subj="filterAddButton" onClick={onClick} disabled={disabled}>
      Add Filter
    </button>
  ),
}));

jest.mock('./table_row_btn_filter_remove', () => ({
  DocViewTableRowBtnFilterRemove: ({ onClick, disabled }: any) => (
    <button data-test-subj="filterRemoveButton" onClick={onClick} disabled={disabled}>
      Remove Filter
    </button>
  ),
}));

jest.mock('./table_row_btn_toggle_column', () => ({
  DocViewTableRowBtnToggleColumn: ({ onClick, active }: any) => (
    <button data-test-subj="toggleColumnButton" onClick={onClick} aria-pressed={active}>
      Toggle Column
    </button>
  ),
}));

jest.mock('./table_row_btn_collapse', () => ({
  DocViewTableRowBtnCollapse: ({ onClick, isCollapsed }: any) => (
    <button data-test-subj="collapseButton" onClick={onClick} aria-expanded={!isCollapsed}>
      {isCollapsed ? 'Expand' : 'Collapse'}
    </button>
  ),
}));

jest.mock('./table_row_icon_no_mapping', () => ({
  DocViewTableRowIconNoMapping: () => <span data-test-subj="noMappingIcon">No Mapping Icon</span>,
}));

jest.mock('./table_row_icon_underscore', () => ({
  DocViewTableRowIconUnderscore: () => <span data-test-subj="underscoreIcon">Underscore Icon</span>,
}));

jest.mock('./field_name/field_name', () => ({
  FieldName: ({ fieldName, fieldType }: any) => (
    <span data-test-subj="fieldName">
      {fieldName} ({fieldType})
    </span>
  ),
}));

describe('DocViewTableRow', () => {
  const mockOnFilter = jest.fn();
  const mockOnToggleCollapse = jest.fn();
  const mockOnToggleColumn = jest.fn();

  const defaultProps = {
    field: 'test_field',
    fieldType: 'string',
    displayNoMappingWarning: false,
    displayUnderscoreWarning: false,
    isCollapsible: false,
    isColumnActive: false,
    isCollapsed: false,
    onToggleCollapse: mockOnToggleCollapse,
    value: '<strong>test value</strong>',
    valueRaw: 'test value',
  };

  const mockFieldMapping = { filterable: true, type: 'string', name: 'test' } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic table row structure', () => {
    render(<DocViewTableRow {...defaultProps} />);

    expect(screen.getByTestId('tableDocViewRow-test_field')).toBeInTheDocument();
    expect(screen.getByTestId('fieldName')).toBeInTheDocument();
    expect(screen.getByTestId('tableDocViewRow-test_field-value')).toBeInTheDocument();
  });

  it('renders and handles filter buttons', () => {
    render(
      <DocViewTableRow {...defaultProps} onFilter={mockOnFilter} fieldMapping={mockFieldMapping} />
    );

    expect(screen.getByTestId('filterAddButton')).toBeInTheDocument();
    expect(screen.getByTestId('filterRemoveButton')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filterAddButton'));
    expect(mockOnFilter).toHaveBeenCalledWith(mockFieldMapping, 'test value', '+');
  });

  it('disables filter buttons when field is not filterable', () => {
    const nonFilterableMapping = { ...mockFieldMapping, filterable: false };
    render(
      <DocViewTableRow
        {...defaultProps}
        onFilter={mockOnFilter}
        fieldMapping={nonFilterableMapping}
      />
    );

    expect(screen.getByTestId('filterAddButton')).toBeDisabled();
    expect(screen.getByTestId('filterRemoveButton')).toBeDisabled();
  });

  it('renders toggle column button when provided', () => {
    render(
      <DocViewTableRow
        {...defaultProps}
        onFilter={mockOnFilter}
        onToggleColumn={mockOnToggleColumn}
        fieldMapping={mockFieldMapping}
      />
    );

    expect(screen.getByTestId('toggleColumnButton')).toBeInTheDocument();
  });

  it('handles collapse functionality', () => {
    render(<DocViewTableRow {...defaultProps} isCollapsible={true} />);

    const collapseButton = screen.getByTestId('collapseButton');
    fireEvent.click(collapseButton);
    expect(mockOnToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders warnings and applies CSS classes', () => {
    render(
      <DocViewTableRow
        {...defaultProps}
        displayUnderscoreWarning={true}
        displayNoMappingWarning={true}
        isCollapsible={true}
        isCollapsed={true}
      />
    );

    expect(screen.getByTestId('underscoreIcon')).toBeInTheDocument();
    expect(screen.getByTestId('noMappingIcon')).toBeInTheDocument();

    const valueElement = screen.getByTestId('tableDocViewRow-test_field-value');
    expect(valueElement).toHaveClass('truncate-by-height');
  });
});
