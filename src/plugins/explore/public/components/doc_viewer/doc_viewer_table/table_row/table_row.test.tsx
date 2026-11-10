/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import DOMPurify from 'dompurify';
import { DocViewTableRow } from './table_row';
import { JsonTreeSettingsContext } from '../../../json_tree/json_tree';

jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((input) => input.replace(/<script[^>]*>.*?<\/script>/gi, '')),
  },
}));

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

  it.each(['date', 'date_nanos'])(
    'does not render value filter buttons for %s fields but keeps the column toggle',
    (fieldType) => {
      render(
        <DocViewTableRow
          {...defaultProps}
          fieldType={fieldType}
          onFilter={mockOnFilter}
          onToggleColumn={mockOnToggleColumn}
          fieldMapping={{ ...mockFieldMapping, type: fieldType }}
        />
      );

      expect(screen.queryByTestId('filterAddButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('filterRemoveButton')).not.toBeInTheDocument();
      expect(screen.getByTestId('toggleColumnButton')).toBeInTheDocument();
    }
  );

  it('does not render value filter buttons for the configured time field even when not date-typed', () => {
    // Mirrors the data-table gate: the time field is suppressed regardless of its mapped type.
    render(
      <DocViewTableRow
        {...defaultProps}
        fieldType="string"
        isTimeField={true}
        onFilter={mockOnFilter}
        onToggleColumn={mockOnToggleColumn}
        fieldMapping={mockFieldMapping}
      />
    );

    expect(screen.queryByTestId('filterAddButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filterRemoveButton')).not.toBeInTheDocument();
    expect(screen.getByTestId('toggleColumnButton')).toBeInTheDocument();
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

  it('sanitizes value using DOMPurify before rendering', () => {
    const maliciousValue = '<script>alert("xss")</script><p>Safe content</p>';

    render(<DocViewTableRow {...defaultProps} value={maliciousValue} />);

    expect(DOMPurify.sanitize).toHaveBeenCalledWith(maliciousValue);
  });

  it('does not render dangerous script tags in HTML output', () => {
    const maliciousValue = '<script>alert("xss")</script><p>Safe content</p>';

    render(<DocViewTableRow {...defaultProps} value={maliciousValue} />);

    const valueElement = screen.getByTestId('tableDocViewRow-test_field-value');
    const html = valueElement.innerHTML;
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert("xss")');
    expect(html).toContain('Safe content');
  });

  describe('JSON values', () => {
    const jsonValue = '{"level":"error","code":42}';
    const renderWithJsonFormatOn = (ui: React.ReactElement) =>
      render(ui, {
        wrapper: ({ children }) => (
          <JsonTreeSettingsContext.Provider value={{ showJsonFormat: true, expandAllJson: false }}>
            {children}
          </JsonTreeSettingsContext.Provider>
        ),
      });

    it('keeps the formatted value while Show as JSON format is off', () => {
      render(<DocViewTableRow {...defaultProps} valueRaw={jsonValue} isCollapsible={true} />);

      const valueElement = screen.getByTestId('tableDocViewRow-test_field-value');
      expect(valueElement).not.toHaveClass('exploreJsonTree');
      expect(screen.getByTestId('collapseButton')).toBeInTheDocument();
    });

    it('renders a JSON string value as a tree under the value test subject', () => {
      renderWithJsonFormatOn(<DocViewTableRow {...defaultProps} valueRaw={jsonValue} />);

      const valueElement = screen.getByTestId('tableDocViewRow-test_field-value');
      expect(valueElement).toHaveClass('exploreJsonTree');
      expect(screen.getByText('"error"')).toBeInTheDocument();
      expect(DOMPurify.sanitize).not.toHaveBeenCalled();
    });

    it('marks the search terms the formatter highlighted', () => {
      const { container } = renderWithJsonFormatOn(
        <DocViewTableRow
          {...defaultProps}
          valueRaw={jsonValue}
          value={'{"level":"<mark>error</mark>","code":42}'}
        />
      );

      expect(
        Array.from(container.querySelectorAll('.exploreJsonTree mark'), (m) => m.textContent)
      ).toEqual(['error']);
    });

    it('shows the raw value in the raw view', () => {
      const { container } = renderWithJsonFormatOn(
        <DocViewTableRow {...defaultProps} valueRaw={jsonValue} />
      );
      fireEvent.click(screen.getByText('Show as raw text'));
      expect(container.querySelector('.exploreJsonTree__raw')?.textContent).toBe(jsonValue);
    });

    it('starts over when the row gets a new value', () => {
      const { rerender } = renderWithJsonFormatOn(
        <DocViewTableRow {...defaultProps} valueRaw={jsonValue} />
      );
      fireEvent.click(screen.getByText('Show as raw text'));

      rerender(<DocViewTableRow {...defaultProps} valueRaw='{"level":"warn"}' />);

      expect(screen.getByText('"warn"')).toBeInTheDocument();
      expect(screen.getByText('Show as raw text')).toBeInTheDocument();
    });

    it('opens each level of a tree of up to 15 levels by default', () => {
      const { container } = renderWithJsonFormatOn(
        <DocViewTableRow {...defaultProps} valueRaw={'{"a":{"b":{"c":1}}}'} />
      );
      expect(Array.from(container.querySelectorAll('details'), (d) => d.open)).toEqual([
        true,
        true,
        true,
      ]);
    });

    it('hides the height collapse button for a JSON value', () => {
      renderWithJsonFormatOn(
        <DocViewTableRow {...defaultProps} valueRaw={jsonValue} isCollapsible={true} />
      );

      expect(screen.queryByTestId('collapseButton')).not.toBeInTheDocument();
    });

    it('keeps the formatted value for a value that is not a JSON string', () => {
      renderWithJsonFormatOn(<DocViewTableRow {...defaultProps} valueRaw={{ level: 'error' }} />);

      const valueElement = screen.getByTestId('tableDocViewRow-test_field-value');
      expect(valueElement).not.toHaveClass('exploreJsonTree');
      expect(valueElement.innerHTML).toBe('<strong>test value</strong>');
    });
  });
});
