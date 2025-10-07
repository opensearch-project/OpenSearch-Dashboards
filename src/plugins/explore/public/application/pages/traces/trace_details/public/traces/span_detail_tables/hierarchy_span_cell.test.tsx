/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HierarchySpanCell } from './hierarchy_span_cell';
import { ParsedHit, SpanTableProps } from './types';

jest.mock('../ppl_resolve_helpers', () => ({
  resolveServiceNameFromSpan: jest.fn((span) => span?.serviceName),
  isSpanError: jest.fn((span) => span?.['status.code'] === 2),
}));

describe('HierarchySpanCell', () => {
  const mockOpenFlyout = jest.fn();
  const mockSetCellProps = jest.fn();
  const mockSetExpandedRows = jest.fn();

  const mockProps: SpanTableProps = {
    hiddenColumns: [],
    openFlyout: mockOpenFlyout,
    payloadData: '',
    filters: [],
    selectedSpanId: undefined,
  };

  const createMockItem = (overrides: Partial<ParsedHit> = {}): ParsedHit => ({
    spanId: 'test-span',
    serviceName: 'test-service',
    name: 'test-operation',
    level: 0,
    children: [],
    'status.code': 0,
    ...overrides,
  });

  const defaultProps = {
    rowIndex: 0,
    items: [createMockItem()],
    disableInteractions: false,
    props: mockProps,
    setCellProps: mockSetCellProps,
    expandedRows: new Set<string>(),
    setExpandedRows: mockSetExpandedRows,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct indentation for level 0', () => {
    const item = createMockItem({ level: 0 });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    const hierarchyCell = document.querySelector('.exploreSpanDetailTable__hierarchyCell');
    expect(hierarchyCell).toHaveStyle('padding-left: 0px');
    expect(screen.getByText('test-service')).toBeInTheDocument();
    expect(screen.getByText('test-operation')).toBeInTheDocument();
  });

  it('renders with correct indentation for level 1', () => {
    const item = createMockItem({ level: 1 });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    const hierarchyCell = document.querySelector('.exploreSpanDetailTable__hierarchyCell');
    expect(hierarchyCell).toHaveStyle('padding-left: 20px');
  });

  it('renders with correct indentation for level 3', () => {
    const item = createMockItem({ level: 3 });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    const hierarchyCell = document.querySelector('.exploreSpanDetailTable__hierarchyCell');
    expect(hierarchyCell).toHaveStyle('padding-left: 60px');
  });

  it('shows expand arrow for items with children', () => {
    const item = createMockItem({
      children: [createMockItem({ spanId: 'child-span' })]
    });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    expect(screen.getByTestId('treeViewExpandArrow')).toBeInTheDocument();
  });

  it('shows empty icon for items without children', () => {
    const item = createMockItem({ children: [] });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    expect(screen.queryByTestId('treeViewExpandArrow')).not.toBeInTheDocument();
  });

  it('toggles expansion when arrow clicked', () => {
    const item = createMockItem({
      spanId: 'parent-span',
      children: [createMockItem({ spanId: 'child-span' })]
    });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByTestId('treeViewExpandArrow'));

    expect(mockSetExpandedRows).toHaveBeenCalledWith(expect.any(Function));
  });

  it('shows down arrow when expanded', () => {
    const item = createMockItem({
      spanId: 'parent-span',
      children: [createMockItem({ spanId: 'child-span' })]
    });
    const expandedRows = new Set(['parent-span']);

    render(<HierarchySpanCell {...defaultProps} items={[item]} expandedRows={expandedRows} />);

    const icon = screen.getByTestId('treeViewExpandArrow');
    expect(icon).toHaveAttribute('data-euiicon-type', 'arrowDown');
  });

  it('shows right arrow when collapsed', () => {
    const item = createMockItem({
      spanId: 'parent-span',
      children: [createMockItem({ spanId: 'child-span' })]
    });

    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    const icon = screen.getByTestId('treeViewExpandArrow');
    expect(icon).toHaveAttribute('data-euiicon-type', 'arrowRight');
  });

  it('displays error icon for error spans', () => {
    const item = createMockItem({ 'status.code': 2 });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    const errorIcon = document.querySelector('[data-euiicon-type="alert"]');
    expect(errorIcon).toBeInTheDocument();
    expect(errorIcon).toHaveAttribute('color', 'danger');
  });

  it('renders as button when interactions enabled', () => {
    render(<HierarchySpanCell {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls openFlyout when button clicked', () => {
    const item = createMockItem({ spanId: 'test-span-id' });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOpenFlyout).toHaveBeenCalledWith('test-span-id');
  });

  it('renders without button when interactions disabled', () => {
    render(<HierarchySpanCell {...defaultProps} disableInteractions={true} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sets selected row class when span is selected', () => {
    const propsWithSelectedSpan = {
      ...mockProps,
      selectedSpanId: 'test-span',
    };

    render(<HierarchySpanCell {...defaultProps} props={propsWithSelectedSpan} />);

    expect(mockSetCellProps).toHaveBeenCalledWith({
      className: ['treeCell--firstColumn', 'exploreSpanDetailTable__selectedRow'],
    });
  });

  it('sets default class when span is not selected', () => {
    render(<HierarchySpanCell {...defaultProps} />);

    expect(mockSetCellProps).toHaveBeenCalledWith({
      className: ['treeCell--firstColumn'],
    });
  });

  it('handles missing service name', () => {
    const item = createMockItem({ serviceName: undefined });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('test-operation')).toBeInTheDocument();
  });

  it('handles missing operation name', () => {
    const item = createMockItem({ name: undefined });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    expect(screen.getByText('test-service')).toBeInTheDocument();
  });

  it('handles null item', () => {
    render(<HierarchySpanCell {...defaultProps} items={[]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
