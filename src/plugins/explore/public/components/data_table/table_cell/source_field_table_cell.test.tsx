/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SourceFieldTableCell } from './source_field_table_cell';

// Simple mocks
jest.mock('../../../helpers/shorten_dotted_string', () => ({
  shortenDottedString: jest.fn((str) => `short_${str}`),
}));

jest.mock('dompurify', () => ({
  sanitize: jest.fn((str) => str),
}));

describe('SourceFieldTableCell', () => {
  const mockDataset = {
    formatHit: jest.fn(),
  };

  const mockRow = {
    _id: 'test-row-1',
    _index: 'test-index',
    _source: { field1: 'value1' },
  };

  const defaultProps = {
    colName: 'test-column',
    dataset: mockDataset,
    row: mockRow,
    isShortDots: false,
  };

  const renderInTable = (props: any) => {
    return render(
      <table>
        <tbody>
          <tr>
            <SourceFieldTableCell {...props} />
          </tr>
        </tbody>
      </table>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table cell with correct structure', () => {
    mockDataset.formatHit.mockReturnValue({ field1: 'value1' });

    renderInTable(defaultProps);

    const cell = screen.getByTestId('docTableField');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveClass('exploreDocTableCell__source');
  });

  it('calls formatHit with the correct row', () => {
    mockDataset.formatHit.mockReturnValue({ field1: 'value1' });

    renderInTable(defaultProps);

    expect(mockDataset.formatHit).toHaveBeenCalledWith(mockRow);
  });

  it('renders field names and values', () => {
    mockDataset.formatHit.mockReturnValue({
      field1: 'value1',
      field2: 'value2',
    });

    renderInTable(defaultProps);

    expect(screen.getByText('field1:')).toBeInTheDocument();
    expect(screen.getByText('field2:')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    mockDataset.formatHit.mockReturnValue({});

    renderInTable(defaultProps);

    const cell = screen.getByTestId('docTableField');
    expect(cell).toBeInTheDocument();
  });
});
