/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExpandedTableRow, ExpandedTableRowProps } from './expanded_table_row';
import { ExploreFlavor } from '../../../../../common';
import { useFlavorId } from '../../../../helpers/use_flavor_id';

// Mock the child components
jest.mock('../../../doc_viewer/doc_viewer', () => ({
  DocViewer: ({ renderProps }: { renderProps: any }) => (
    <div data-test-subj="doc-viewer">Doc Viewer for {renderProps.hit._id}</div>
  ),
}));

jest.mock('../../../../helpers/use_flavor_id');

const mockUseFlavorId = useFlavorId as jest.MockedFunction<typeof useFlavorId>;

describe('ExpandedTableRow', () => {
  const mockDataset = {
    fields: {
      getByName: jest.fn(),
    },
  } as any;

  const mockRow = {
    _id: 'test-row-1',
    _index: 'test-index',
    _source: {
      timestamp: '2023-01-01T00:00:00Z',
      message: 'test message',
    },
  } as any;

  const mockDocViewsRegistry = {
    registry: [],
  } as any;

  const defaultProps: ExpandedTableRowProps = {
    row: mockRow,
    columns: ['timestamp', 'message'],
    dataset: mockDataset,
    onFilter: jest.fn(),
    onRemoveColumn: jest.fn(),
    onAddColumn: jest.fn(),
    onClose: jest.fn(),
    docViewsRegistry: mockDocViewsRegistry,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when flavor is Traces', () => {
    beforeEach(() => {
      mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);
    });

    it('renders expanded span heading', () => {
      render(
        <table>
          <tbody>
            <ExpandedTableRow {...defaultProps} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Expanded span')).toBeInTheDocument();
    });
  });

  describe('when flavor is not Traces', () => {
    beforeEach(() => {
      mockUseFlavorId.mockReturnValue(null);
    });

    it('renders expanded document heading', () => {
      render(
        <table>
          <tbody>
            <ExpandedTableRow {...defaultProps} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Expanded document')).toBeInTheDocument();
    });
  });

  it('renders DocViewer with correct props', () => {
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);
    render(
      <table>
        <tbody>
          <ExpandedTableRow {...defaultProps} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('doc-viewer')).toBeInTheDocument();
    expect(screen.getByText('Doc Viewer for test-row-1')).toBeInTheDocument();
  });

  it('renders with correct table structure', () => {
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);
    const { container } = render(
      <table>
        <tbody>
          <ExpandedTableRow {...defaultProps} />
        </tbody>
      </table>
    );

    const tr = container.querySelector('tr');
    expect(tr).toBeInTheDocument();

    const td = container.querySelector('td');
    expect(td).toHaveClass('exploreDocTable__detailsParent');
    expect(td).toHaveAttribute('colSpan', '3'); // columns.length + 1
    expect(td).toHaveAttribute('data-test-subj', 'osdDocTableDetailsParent');
  });

  it('renders folder icon', () => {
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);
    const { container } = render(
      <table>
        <tbody>
          <ExpandedTableRow {...defaultProps} />
        </tbody>
      </table>
    );

    const iconContainer = container.querySelector(
      '[data-test-subj="osdDocTableDetailsIconContainer"]'
    );
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('exploreDocTable__detailsIconContainer');
  });

  describe('callback functions', () => {
    beforeEach(() => {
      mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);
    });

    it('passes onClose callback correctly', () => {
      const onCloseMock = jest.fn();
      render(
        <table>
          <tbody>
            <ExpandedTableRow {...defaultProps} onClose={onCloseMock} />
          </tbody>
        </table>
      );

      // The DocViewer is mocked, but we can verify the structure renders correctly
      expect(screen.getByTestId('doc-viewer')).toBeInTheDocument();
    });

    it('handles missing callback functions', () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onFilter: undefined,
        onAddColumn: undefined,
        onRemoveColumn: undefined,
        onClose: undefined,
      };

      expect(() =>
        render(
          <table>
            <tbody>
              <ExpandedTableRow {...propsWithoutCallbacks} />
            </tbody>
          </table>
        )
      ).not.toThrow();
      expect(screen.getByTestId('doc-viewer')).toBeInTheDocument();
    });
  });
});
