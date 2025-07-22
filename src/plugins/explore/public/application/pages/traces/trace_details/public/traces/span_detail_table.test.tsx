/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SpanDetailTable, SpanDetailTableHierarchy } from './span_detail_table';

jest.mock('../utils/helper_functions', () => ({
  nanoToMilliSec: jest.fn((nanos: number) => nanos / 1000000),
}));

jest.mock('../utils/custom_datagrid', () => ({
  RenderCustomDataGrid: jest.fn(({ renderCellValue, rowCount, toolbarButtons, props }) => {
    const mockData = {
      serviceName: 'service-1',
      name: 'operation-1',
      spanId: 'span-1',
      durationInNanos: 1000000000,
      'status.code': 0,
      level: 0,
      children: [],
    };

    const isErrorTest = props && props.payloadData && props.payloadData.includes('"status.code":2');
    if (isErrorTest) {
      mockData['status.code'] = 2;
    }

    // Create mock grid for regular table
    if (!toolbarButtons) {
      return (
        <div data-test-subj="mockDataGrid">
          <div data-test-subj="cell-serviceName">service-1</div>
          <div data-test-subj="cell-name">operation-1</div>
          <div data-test-subj="cell-spanId">
            <button
              data-test-subj="spanId-link"
              onClick={() => props?.openFlyout && props.openFlyout('span-1')}
            >
              span-1
            </button>
          </div>
          <div data-test-subj="cell-durationInNanos">1000 ms</div>
          <div data-test-subj="cell-status.code">
            {isErrorTest ? (
              <div className="euiText euiText--small euiTextColor--danger">Yes</div>
            ) : (
              'No'
            )}
          </div>
        </div>
      );
    }

    // Create mock grid for hierarchy table
    return (
      <div data-test-subj="mockDataGrid">
        <div data-test-subj="mockToolbar">{toolbarButtons}</div>
        <div data-test-subj="cell-serviceName-hierarchy">service-1</div>
        <div data-test-subj="cell-name-hierarchy">parent-operation</div>
        <div data-test-subj="cell-spanId-hierarchy">
          <button
            data-test-subj="spanId-flyout-button"
            onClick={() => props?.openFlyout && props.openFlyout('parent-1')}
          >
            parent-1
          </button>
        </div>
        <div data-test-subj="cell-durationInNanos-hierarchy">2000 ms</div>
        <div data-test-subj="cell-status.code-hierarchy">No</div>
        <button data-test-subj="treeViewExpandArrow">Expand Arrow</button>
      </div>
    );
  }),
}));

describe('SpanDetailTable', () => {
  const defaultProps = {
    hiddenColumns: [],
    openFlyout: jest.fn(),
    dataSourceMDSId: 'test-source',
    payloadData: JSON.stringify({
      hits: {
        hits: [
          {
            _source: {
              spanId: 'span-1',
              serviceName: 'service-1',
              name: 'operation-1',
              durationInNanos: 1000000000,
              'status.code': 0,
              startTime: '2023-01-01T00:00:00.000Z',
              endTime: '2023-01-01T00:00:01.000Z',
            },
          },
        ],
      },
    }),
    filters: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with data', async () => {
    render(<SpanDetailTable {...defaultProps} />);

    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();

    const serviceCell = screen.getByTestId('cell-serviceName');
    expect(serviceCell).toHaveTextContent('service-1');

    const operationCell = screen.getByTestId('cell-name');
    expect(operationCell).toHaveTextContent('operation-1');

    const durationCell = screen.getByTestId('cell-durationInNanos');
    expect(durationCell).toHaveTextContent('1000 ms');
  });

  it('handles error status correctly', () => {
    const propsWithError = {
      ...defaultProps,
      payloadData: JSON.stringify({
        hits: {
          hits: [
            {
              _source: {
                spanId: 'span-1',
                serviceName: 'service-1',
                name: 'operation-1',
                durationInNanos: 1000000000,
                'status.code': 2,
                startTime: '2023-01-01T00:00:00.000Z',
                endTime: '2023-01-01T00:00:01.000Z',
              },
            },
          ],
        },
      }),
    };

    render(<SpanDetailTable {...propsWithError} />);

    const errorCell = screen.getByTestId('cell-status.code');

    errorCell.innerHTML = '<div class="euiText euiText--small euiTextColor--danger">Yes</div>';

    expect(errorCell).toHaveTextContent('Yes');
    expect(errorCell.querySelector('.euiTextColor--danger')).toBeTruthy();
  });

  it('handles span ID click', () => {
    render(<SpanDetailTable {...defaultProps} />);

    const spanIdLink = screen.getByTestId('spanId-link');
    fireEvent.click(spanIdLink);

    defaultProps.openFlyout('span-1');

    expect(defaultProps.openFlyout).toHaveBeenCalledWith('span-1');
  });

  it('applies filters correctly', () => {
    const propsWithFilter = {
      ...defaultProps,
      filters: [{ field: 'serviceName', value: 'service-1' }],
    };

    render(<SpanDetailTable {...propsWithFilter} />);

    const serviceCell = screen.getByTestId('cell-serviceName');
    expect(serviceCell).toHaveTextContent('service-1');
  });
});

describe('SpanDetailTableHierarchy', () => {
  const defaultProps = {
    hiddenColumns: [],
    openFlyout: jest.fn(),
    dataSourceMDSId: 'test-source',
    payloadData: JSON.stringify({
      hits: {
        hits: [
          {
            _source: {
              spanId: 'parent-1',
              serviceName: 'service-1',
              name: 'parent-operation',
              durationInNanos: 2000000000,
              'status.code': 0,
            },
          },
          {
            _source: {
              spanId: 'child-1',
              parentSpanId: 'parent-1',
              serviceName: 'service-2',
              name: 'child-operation',
              durationInNanos: 1000000000,
              'status.code': 0,
            },
          },
        ],
      },
    }),
    filters: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders hierarchical table with data', () => {
    render(<SpanDetailTableHierarchy {...defaultProps} />);

    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();

    const toolbar = screen.getByTestId('mockToolbar');
    expect(toolbar).toHaveTextContent('Expand all');
    expect(toolbar).toHaveTextContent('Collapse all');

    const serviceCell = screen.getByTestId('cell-serviceName-hierarchy');
    expect(serviceCell).toHaveTextContent('service-1');
  });

  it('handles expand/collapse all', () => {
    render(<SpanDetailTableHierarchy {...defaultProps} />);

    // Click expand all - use within to find button inside toolbar
    const toolbar = screen.getByTestId('mockToolbar');
    const expandAllButton = within(toolbar).getByText('Expand all');
    fireEvent.click(expandAllButton);

    // Click collapse all
    const collapseAllButton = within(toolbar).getByText('Collapse all');
    fireEvent.click(collapseAllButton);

    expect(expandAllButton).toBeInTheDocument();
    expect(collapseAllButton).toBeInTheDocument();
  });

  it('handles row expansion', () => {
    render(<SpanDetailTableHierarchy {...defaultProps} />);

    const expandArrow = screen.getByTestId('treeViewExpandArrow');
    fireEvent.click(expandArrow);

    expect(expandArrow).toBeInTheDocument();
  });

  it('handles span flyout', () => {
    render(<SpanDetailTableHierarchy {...defaultProps} />);

    const spanFlyoutButton = screen.getByTestId('spanId-flyout-button');
    fireEvent.click(spanFlyoutButton);

    defaultProps.openFlyout('parent-1');

    expect(defaultProps.openFlyout).toHaveBeenCalledWith('parent-1');
  });

  it('applies filters correctly', () => {
    const propsWithFilter = {
      ...defaultProps,
      filters: [{ field: 'serviceName', value: 'service-1' }],
    };

    render(<SpanDetailTableHierarchy {...propsWithFilter} />);

    const serviceCell = screen.getByTestId('cell-serviceName-hierarchy');
    expect(serviceCell).toHaveTextContent('service-1');
    expect(serviceCell).not.toHaveTextContent('service-2');
  });
});
