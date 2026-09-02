/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TableRowContent } from './table_row_content';

// Mock child components
jest.mock('../table_cell/table_cell', () => ({
  TableCell: ({ columnId, sanitizedCellValue, disableValueFilter, dataset }: any) => (
    <td
      data-test-subj={`table-cell-${columnId}`}
      data-disable-value-filter={String(Boolean(disableValueFilter))}
      data-has-dataset={String(Boolean(dataset))}
    >
      {sanitizedCellValue}
    </td>
  ),
}));

jest.mock('../table_cell/empty_table_cell', () => ({
  EmptyTableCell: ({ colName }: any) => <td data-test-subj={`empty-cell-${colName}`}>-</td>,
}));

jest.mock('../table_cell/source_field_table_cell', () => ({
  SourceFieldTableCell: ({ colName }: any) => (
    <td data-test-subj={`source-cell-${colName}`}>Source Content</td>
  ),
}));

jest.mock('../table_cell/non_filterable_table_cell', () => ({
  NonFilterableTableCell: ({ colName, sanitizedCellValue }: any) => (
    <td data-test-subj={`non-filterable-cell-${colName}`}>{sanitizedCellValue}</td>
  ),
}));

jest.mock('dompurify', () => ({
  sanitize: jest.fn((str) => `sanitized_${str}`),
}));

describe('TableRowContent', () => {
  const mockDataset = {
    fields: { getByName: jest.fn() },
    flattenHit: jest.fn(),
    formatField: jest.fn(),
    timeFieldName: 'timestamp',
  };

  const mockRow = {
    _id: 'test-row-1',
    _index: 'test-index',
    _source: { field1: 'value1' },
    isAnchor: false,
  };

  const mockOnToggleExpand = jest.fn();

  const defaultProps = {
    row: mockRow,
    columns: ['field1', 'field2'],
    dataset: mockDataset,
    onFilter: jest.fn(),
    isShortDots: false,
    isExpanded: false,
    onToggleExpand: mockOnToggleExpand,
    isOnTracesPage: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataset.flattenHit.mockReturnValue({
      field1: 'flattened_value1',
      field2: 'flattened_value2',
    });
  });

  it('renders table row with expand toggle', () => {
    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    const expandButton = screen.getByRole('button');
    expect(expandButton).toBeInTheDocument();
  });

  it('calls onToggleExpand when expand button is clicked', () => {
    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(mockOnToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('renders source field cell for _source type', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: '_source' });

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} columns={['_source']} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('source-cell-_source')).toBeInTheDocument();
  });

  it('renders empty cells when formatField returns undefined', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: true });
    mockDataset.formatField.mockReturnValue(undefined);

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('empty-cell-field1')).toBeInTheDocument();
    expect(screen.getByTestId('empty-cell-field2')).toBeInTheDocument();
  });

  it('renders regular table cells for filterable fields', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: true });
    mockDataset.formatField.mockReturnValue('test_value');

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-cell-field1')).toBeInTheDocument();
    expect(screen.getByTestId('table-cell-field2')).toBeInTheDocument();
  });

  it('disables value filtering on the configured time field regardless of its type', () => {
    // timeFieldName is 'timestamp'; type is string here to prove it's the identity check.
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: true });
    mockDataset.formatField.mockReturnValue('test_value');

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} columns={['timestamp', 'field2']} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-cell-timestamp')).toHaveAttribute(
      'data-disable-value-filter',
      'true'
    );
    expect(screen.getByTestId('table-cell-field2')).toHaveAttribute(
      'data-disable-value-filter',
      'false'
    );
  });

  it.each(['date', 'date_nanos'])(
    'disables value filtering on %s fields even when they are not the time field',
    (type) => {
      mockDataset.fields.getByName.mockReturnValue({ type, filterable: true });
      mockDataset.formatField.mockReturnValue('test_value');

      render(
        <table>
          <tbody>
            <TableRowContent {...(defaultProps as any)} columns={['field1']} />
          </tbody>
        </table>
      );

      expect(screen.getByTestId('table-cell-field1')).toHaveAttribute(
        'data-disable-value-filter',
        'true'
      );
    }
  );

  it('hides expand toggle when on traces page', () => {
    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} isOnTracesPage={true} />
        </tbody>
      </table>
    );
    expect(screen.queryByTestId('docTableExpandToggleColumn')).not.toBeInTheDocument();
  });

  it('routes a non-filterable, non-trace field to the plain NonFilterableTableCell', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: false });
    mockDataset.formatField.mockReturnValue('test_value');

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} columns={['field1']} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('non-filterable-cell-field1')).toBeInTheDocument();
    expect(screen.queryByTestId('table-cell-field1')).not.toBeInTheDocument();
  });

  it('keeps a non-filterable Span ID column as an interactive TableCell on the traces page', () => {
    // Regression: a field-caps conflict can flip a trace-link field to
    // non-filterable; it must still render its link, not degrade to plain text.
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: false });
    mockDataset.formatField.mockReturnValue('span-123');

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} isOnTracesPage={true} columns={['spanId']} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-cell-spanId')).toBeInTheDocument();
    expect(screen.queryByTestId('non-filterable-cell-spanId')).not.toBeInTheDocument();
    // A non-filterable field should not offer value-filter buttons.
    expect(screen.getByTestId('table-cell-spanId')).toHaveAttribute(
      'data-disable-value-filter',
      'true'
    );
  });

  it('passes the dataset down to TableCell (so links do not depend on context)', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: true });
    mockDataset.formatField.mockReturnValue('test_value');

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} columns={['field1']} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-cell-field1')).toHaveAttribute('data-has-dataset', 'true');
  });
});
