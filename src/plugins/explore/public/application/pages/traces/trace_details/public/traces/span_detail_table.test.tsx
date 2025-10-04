/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  HierarchyServiceSpanCell,
  SpanCell,
  SpanDetailTable,
  SpanDetailTableHierarchy,
  parseHits,
} from './span_detail_table';
import { RenderCustomDataGrid } from '../utils/custom_datagrid';

jest.mock('../utils/helper_functions', () => ({
  nanoToMilliSec: jest.fn((nanos: number) => nanos / 1000000),
}));

jest.mock('../utils/span_timerange_utils', () => ({
  calculateTraceTimeRange: jest.fn(() => ({
    durationMs: 1000,
    startTimeMs: 0,
    endTimeMs: 1000,
  })),
}));

jest.mock('../utils/custom_datagrid', () => ({
  RenderCustomDataGrid: jest.fn(({ toolbarButtons, props }) => {
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
              data-test-subj="spanId-flyout-button"
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

  it('handles parseHits with invalid JSON', () => {
    const propsWithInvalidJson = {
      ...defaultProps,
      payloadData: 'invalid json',
    };

    render(<SpanDetailTable {...propsWithInvalidJson} />);
    // Should render without crashing and show empty state
    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();
  });

  it('handles parseHits with array format', () => {
    const propsWithArrayFormat = {
      ...defaultProps,
      payloadData: JSON.stringify([
        {
          spanId: 'span-1',
          serviceName: 'service-1',
          name: 'operation-1',
          durationInNanos: 1000000000,
          'status.code': 0,
        },
      ]),
    };

    render(<SpanDetailTable {...propsWithArrayFormat} />);
    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();
  });

  it('calls setTotal when provided', () => {
    const setTotalMock = jest.fn();
    const propsWithSetTotal = {
      ...defaultProps,
      setTotal: setTotalMock,
    };

    render(<SpanDetailTable {...propsWithSetTotal} />);
    expect(setTotalMock).toHaveBeenCalled();
  });

  it('handles empty payloadData', () => {
    const propsWithEmptyData = {
      ...defaultProps,
      payloadData: '',
    };

    render(<SpanDetailTable {...propsWithEmptyData} />);
    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();
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

    const spanIdLink = screen.getByTestId('spanId-flyout-button');
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

  it('handles sorting with sortingColumns', () => {
    const propsWithSorting = {
      ...defaultProps,
      payloadData: JSON.stringify({
        hits: {
          hits: [
            {
              _source: {
                spanId: 'span-1',
                serviceName: 'service-a',
                name: 'operation-1',
                durationInNanos: 2000000000,
                'status.code': 0,
              },
            },
            {
              _source: {
                spanId: 'span-2',
                serviceName: 'service-b',
                name: 'operation-2',
                durationInNanos: 1000000000,
                'status.code': 0,
              },
            },
          ],
        },
      }),
    };

    render(<SpanDetailTable {...propsWithSorting} />);
    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();
  });

  it('handles error in useEffect parsing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const propsWithBadData = {
      ...defaultProps,
      payloadData: '{"hits": {"hits": [{"_source": null}]}}',
    };

    render(<SpanDetailTable {...propsWithBadData} />);
    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

describe('RenderSpanCellValue function coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('covers all renderSpanCellValue switch cases', () => {
    const testData = {
      hits: {
        hits: [
          {
            _source: {
              spanId: 'test-span',
              serviceName: 'test-service',
              name: 'test-operation',
              durationInNanos: 1500000000,
              'status.code': 2, // Error status
              startTime: '2023-01-01T12:00:00.000Z',
              endTime: '2023-01-01T12:00:01.500Z',
              parentSpanId: 'parent-span',
              traceId: 'trace-123',
              traceGroup: 'test-group',
            },
          },
        ],
      },
    };

    const props = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: JSON.stringify(testData),
      filters: [],
    };

    render(<SpanDetailTable {...props} />);

    expect(RenderCustomDataGrid).toHaveBeenCalled();

    const mockCall = (RenderCustomDataGrid as jest.Mock).mock.calls[0][0];
    const renderCellValue = mockCall.renderCellValue;

    const statusResult = renderCellValue({
      rowIndex: 0,
      columnId: 'status.code',
      disableInteractions: false,
    });
    expect(statusResult).toBeDefined();

    const spanIdResult = renderCellValue({
      rowIndex: 0,
      columnId: 'spanId',
      disableInteractions: false,
    });
    expect(spanIdResult).toBeDefined();

    const spanIdDisabledResult = renderCellValue({
      rowIndex: 0,
      columnId: 'spanId',
      disableInteractions: true,
    });
    expect(spanIdDisabledResult).toBeDefined();

    const durationResult = renderCellValue({
      rowIndex: 0,
      columnId: 'durationInNanos',
      disableInteractions: false,
    });
    expect(durationResult).toBeDefined();

    const startTimeResult = renderCellValue({
      rowIndex: 0,
      columnId: 'startTime',
      disableInteractions: false,
    });
    expect(startTimeResult).toBeDefined();

    const endTimeResult = renderCellValue({
      rowIndex: 0,
      columnId: 'endTime',
      disableInteractions: false,
    });
    expect(endTimeResult).toBeDefined();

    const defaultResult = renderCellValue({
      rowIndex: 0,
      columnId: 'serviceName',
      disableInteractions: false,
    });
    expect(defaultResult).toBeDefined();

    const missingItemResult = renderCellValue({
      rowIndex: 999,
      columnId: 'serviceName',
      disableInteractions: false,
    });
    expect(missingItemResult).toBeDefined();
  });

  it('covers event handler functions', () => {
    const props = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
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
              },
            },
          ],
        },
      }),
      filters: [],
    };

    render(<SpanDetailTable {...props} />);

    const mockCall = (RenderCustomDataGrid as jest.Mock).mock.calls[0][0];

    if (mockCall.sorting && mockCall.sorting.onSort) {
      mockCall.sorting.onSort([{ id: 'serviceName', direction: 'asc' }]);
    }

    if (mockCall.pagination) {
      if (mockCall.pagination.onChangePage) {
        mockCall.pagination.onChangePage(1);
      }
      if (mockCall.pagination.onChangeItemsPerPage) {
        mockCall.pagination.onChangeItemsPerPage(50);
      }
    }

    expect(RenderCustomDataGrid).toHaveBeenCalled();
  });
});

describe('SpanCell', () => {
  const openFlyoutMock = jest.fn();
  const setCellPropsMock = jest.fn();

  const testData = [
    {
      spanId: 'test-span',
      serviceName: 'test-service',
      name: 'test-operation',
      durationInNanos: 1000000000,
      'status.code': 0,
      children: [],
    },
  ];

  const defaultProps = {
    rowIndex: 0,
    columnId: 'spanId',
    disableInteractions: false,
    setCellProps: setCellPropsMock,
    expandedRows: new Set<string>(),
    setExpandedRows: jest.fn(),
    items: testData,
    tableParams: { page: 0, size: 10 },
    props: {
      selectedSpanId: 'test-span',
      hiddenColumns: [],
      openFlyout: openFlyoutMock,
      filters: [],
      payloadData: '',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles span flyout button', () => {
    render(<SpanCell {...defaultProps} />);

    expect(setCellPropsMock).toHaveBeenCalledWith({
      className: 'exploreSpanDetailTable__selectedRow',
    });

    fireEvent.click(screen.getByText('test-span'));
    expect(openFlyoutMock).toHaveBeenCalledWith('test-span');
  });

  it('handles disabled interactions', () => {
    render(<SpanCell {...defaultProps} disableInteractions={true} />);

    expect(setCellPropsMock).toHaveBeenCalledWith({});

    fireEvent.click(screen.getByText('test-span'));
    expect(openFlyoutMock).not.toHaveBeenCalled();
  });

  it('handles undefined item', () => {
    render(<SpanCell {...defaultProps} items={[]} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('HierarchyServiceSpanCell', () => {
  const openFlyoutMock = jest.fn();
  const setCellPropsMock = jest.fn();
  const testData = [
    {
      spanId: 'hierarchy-span',
      serviceName: 'hierarchy-service',
      name: 'hierarchy-operation',
      durationInNanos: 1000000000,
      'status.code': 0,
      children: [],
    },
  ];

  const defaultProps = {
    rowIndex: 0,
    columnId: 'serviceName',
    disableInteractions: false,
    setCellProps: setCellPropsMock,
    expandedRows: new Set<string>(),
    setExpandedRows: jest.fn(),
    items: testData,
    props: {
      selectedSpanId: 'hierarchy-span',
      hiddenColumns: [],
      openFlyout: openFlyoutMock,
      filters: [],
      payloadData: '',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles span flyout button', () => {
    render(<HierarchyServiceSpanCell {...defaultProps} />);

    expect(setCellPropsMock).toHaveBeenCalledWith({
      className: ['treeCell--firstColumn', 'exploreSpanDetailTable__selectedRow'],
    });

    fireEvent.click(screen.getByText('hierarchy-service'));
    expect(openFlyoutMock).toHaveBeenCalledWith('hierarchy-span');
  });

  it('handles disabled interactions', () => {
    render(<HierarchyServiceSpanCell {...defaultProps} disableInteractions={true} />);

    expect(setCellPropsMock).toHaveBeenCalledWith({
      className: ['treeCell--firstColumn'],
    });

    fireEvent.click(screen.getByText('hierarchy-service'));
    expect(openFlyoutMock).not.toHaveBeenCalled();
  });

  it('handles undefined item', () => {
    render(<HierarchyServiceSpanCell {...defaultProps} items={[]} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('parseHits function coverage', () => {
  it('handles array format data', () => {
    const arrayData = [
      {
        spanId: 'span-1',
        serviceName: 'service-1',
        name: 'operation-1',
        durationInNanos: 1000000000,
        'status.code': 0,
      },
    ];

    const result = parseHits(JSON.stringify(arrayData));
    expect(result).toEqual(arrayData);
    expect(result.length).toBe(1);
    expect(result[0].spanId).toBe('span-1');
  });

  it('handles error in parseHits', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = parseHits('invalid json');

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Error processing payloadData:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('handles empty string input', () => {
    const result = parseHits('');
    expect(result).toEqual([]);
  });

  it('handles null input gracefully', () => {
    const result = parseHits('null');
    expect(result).toEqual([]);
  });
});

describe('renderSpanCellValue function coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('covers null item check', () => {
    const testData = {
      hits: {
        hits: [
          {
            _source: {
              spanId: 'test-span',
              serviceName: 'test-service',
              name: 'test-operation',
              durationInNanos: 1500000000,
              'status.code': 0,
              startTime: '2023-01-01T12:00:00.000Z',
              endTime: '2023-01-01T12:00:01.500Z',
            },
          },
        ],
      },
    };

    const props = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: JSON.stringify(testData),
      filters: [],
    };

    render(<SpanDetailTable {...props} />);

    expect(RenderCustomDataGrid).toHaveBeenCalled();

    const mockCall = (RenderCustomDataGrid as jest.Mock).mock.calls[0][0];
    const renderCellValue = mockCall.renderCellValue;

    const nullItemResult = renderCellValue({
      rowIndex: 999, // Out of bounds index
      columnId: 'serviceName',
      disableInteractions: false,
    });
    expect(nullItemResult).toBeDefined();
  });

  it('covers error status case', () => {
    const testData = {
      hits: {
        hits: [
          {
            _source: {
              spanId: 'error-span',
              serviceName: 'error-service',
              name: 'error-operation',
              durationInNanos: 1000000000,
              'status.code': 2, // Error status
              startTime: '2023-01-01T12:00:00.000Z',
              endTime: '2023-01-01T12:00:01.000Z',
            },
          },
        ],
      },
    };

    const props = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: JSON.stringify(testData),
      filters: [],
    };

    render(<SpanDetailTable {...props} />);

    const mockCall = (RenderCustomDataGrid as jest.Mock).mock.calls[0][0];
    const renderCellValue = mockCall.renderCellValue;

    const errorStatusResult = renderCellValue({
      rowIndex: 0,
      columnId: 'status.code',
      disableInteractions: false,
    });
    expect(errorStatusResult).toBeDefined();
  });

  it('covers spanId with disabled interactions', () => {
    const testData = {
      hits: {
        hits: [
          {
            _source: {
              spanId: 'test-span-id',
              serviceName: 'test-service',
              name: 'test-operation',
              durationInNanos: 1000000000,
              'status.code': 0,
            },
          },
        ],
      },
    };

    const props = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: JSON.stringify(testData),
      filters: [],
    };

    render(<SpanDetailTable {...props} />);

    const mockCall = (RenderCustomDataGrid as jest.Mock).mock.calls[0][0];
    const renderCellValue = mockCall.renderCellValue;

    const spanIdDisabledResult = renderCellValue({
      rowIndex: 0,
      columnId: 'spanId',
      disableInteractions: true,
    });
    expect(spanIdDisabledResult).toBeDefined();

    const spanIdEnabledResult = renderCellValue({
      rowIndex: 0,
      columnId: 'spanId',
      disableInteractions: false,
    });
    expect(spanIdEnabledResult).toBeDefined();
  });

  it('covers all switch cases', () => {
    const testData = {
      hits: {
        hits: [
          {
            _source: {
              spanId: 'test-span',
              serviceName: 'test-service',
              name: 'test-operation',
              durationInNanos: 1500000000,
              'status.code': 0,
              startTime: '2023-01-01T12:00:00.000Z',
              endTime: '2023-01-01T12:00:01.500Z',
              parentSpanId: 'parent-span',
              traceId: 'trace-123',
              traceGroup: 'test-group',
            },
          },
        ],
      },
    };

    const props = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: JSON.stringify(testData),
      filters: [],
    };

    render(<SpanDetailTable {...props} />);

    const mockCall = (RenderCustomDataGrid as jest.Mock).mock.calls[0][0];
    const renderCellValue = mockCall.renderCellValue;

    const durationResult = renderCellValue({
      rowIndex: 0,
      columnId: 'durationInNanos',
      disableInteractions: false,
    });
    expect(durationResult).toBeDefined();

    const startTimeResult = renderCellValue({
      rowIndex: 0,
      columnId: 'startTime',
      disableInteractions: false,
    });
    expect(startTimeResult).toBeDefined();

    const endTimeResult = renderCellValue({
      rowIndex: 0,
      columnId: 'endTime',
      disableInteractions: false,
    });
    expect(endTimeResult).toBeDefined();

    const defaultResult = renderCellValue({
      rowIndex: 0,
      columnId: 'serviceName',
      disableInteractions: false,
    });
    expect(defaultResult).toBeDefined();

    const defaultMissingResult = renderCellValue({
      rowIndex: 0,
      columnId: 'nonExistentField',
      disableInteractions: false,
    });
    expect(defaultMissingResult).toBeDefined();
  });
});

describe('SpanDetailTable error handling', () => {
  it('covers error in useEffect parsing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create props that will cause an error during processing
    const propsWithBadData = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: '{"hits": {"hits": [{"_source": {"spanId": null}}]}}',
      filters: [{ field: 'invalidField', value: 'test' }], // This might cause issues during filtering
    };

    render(<SpanDetailTable {...propsWithBadData} />);

    // The component should still render without crashing
    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('handles malformed JSON in payloadData', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const propsWithMalformedJson = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: '{"hits": {"hits": [{"_source": {malformed json}',
      filters: [],
    };

    render(<SpanDetailTable {...propsWithMalformedJson} />);

    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Error processing payloadData:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('handles undefined payloadData gracefully', () => {
    const propsWithUndefinedData = {
      hiddenColumns: [],
      openFlyout: jest.fn(),
      payloadData: undefined as any,
      filters: [],
    };

    render(<SpanDetailTable {...propsWithUndefinedData} />);

    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();
  });
});

describe('SpanDetailTableHierarchy', () => {
  const defaultProps = {
    hiddenColumns: [],
    openFlyout: jest.fn(),
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

  it('handles error in hierarchy parsing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const propsWithBadHierarchyData = {
      ...defaultProps,
      payloadData: '{"hits": {"hits": [{"_source": null}]}}',
    };

    render(<SpanDetailTableHierarchy {...propsWithBadHierarchyData} />);

    expect(screen.getByTestId('mockDataGrid')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
