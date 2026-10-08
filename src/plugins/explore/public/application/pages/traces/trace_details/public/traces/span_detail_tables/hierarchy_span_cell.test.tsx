/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { HierarchySpanCell } from './hierarchy_span_cell';
import { buildTraceDependencies } from '../../services/trace_dependencies';
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

  it('renders no tree guides at level 0', () => {
    const item = createMockItem({ level: 0 });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    expect(screen.queryAllByTestId('treeGuide')).toHaveLength(0);
    expect(screen.getByText('test-service')).toBeInTheDocument();
    expect(screen.getByText('test-operation')).toBeInTheDocument();
  });

  it('renders one tree guide per level (level 1)', () => {
    const item = createMockItem({ level: 1 });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    expect(screen.queryAllByTestId('treeGuide')).toHaveLength(1);
  });

  it('renders one tree guide per level (level 3)', () => {
    const item = createMockItem({ level: 3 });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    expect(screen.queryAllByTestId('treeGuide')).toHaveLength(3);
  });

  it('shows expand arrow for items with children', () => {
    const item = createMockItem({
      children: [createMockItem({ spanId: 'child-span' })],
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
      children: [createMockItem({ spanId: 'child-span' })],
    });
    render(<HierarchySpanCell {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByTestId('treeViewExpandArrow'));

    expect(mockSetExpandedRows).toHaveBeenCalledWith(expect.any(Function));
  });

  it('shows down arrow when expanded', () => {
    const item = createMockItem({
      spanId: 'parent-span',
      children: [createMockItem({ spanId: 'child-span' })],
    });
    const expandedRows = new Set(['parent-span']);

    render(<HierarchySpanCell {...defaultProps} items={[item]} expandedRows={expandedRows} />);

    const icon = screen.getByTestId('treeViewExpandArrow');
    expect(icon).toHaveAttribute('data-euiicon-type', 'arrowDown');
  });

  it('shows right arrow when collapsed', () => {
    const item = createMockItem({
      spanId: 'parent-span',
      children: [createMockItem({ spanId: 'child-span' })],
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

  describe('dependency icon', () => {
    // Classified for the whole trace, as the trace view provides it.
    const renderItem = (
      overrides: Partial<ParsedHit>,
      children: Array<Partial<ParsedHit>> = []
    ) => {
      const item = createMockItem(overrides);
      const kids = children.map((c) => createMockItem({ ...c, parentSpanId: item.spanId }));
      return render(
        <HierarchySpanCell
          {...defaultProps}
          items={[item]}
          dependencies={buildTraceDependencies([item, ...kids])}
        />
      );
    };

    it('marks a database span', () => {
      renderItem({
        kind: 'SPAN_KIND_CLIENT',
        attributes: { db_system: 'redis', 'server.address': 'valkey-cart' },
      });
      expect(screen.getByTestId('spanDependencyIcon')).toHaveAttribute(
        'aria-label',
        'Database: redis'
      );
    });

    it('marks a messaging span', () => {
      renderItem({
        kind: 'SPAN_KIND_PRODUCER',
        attributes: { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' },
      });
      expect(screen.getByTestId('spanDependencyIcon')).toHaveAttribute(
        'aria-label',
        'Messaging: kafka'
      );
    });

    it('marks a leaf CLIENT span to a named external peer', () => {
      renderItem({
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'server.address': 'api.openai.com', 'server.port': 443 },
      });
      expect(screen.getByTestId('spanDependencyIcon')).toHaveAttribute('aria-label', 'External');
    });

    it('marks an external CLIENT span whose children stay in the same service', () => {
      // e.g. an LLM client span with nested tool/transport spans of its own service.
      renderItem(
        {
          kind: 'SPAN_KIND_CLIENT',
          attributes: { 'server.address': 'api.openai.com', 'server.port': 443 },
        },
        [{ spanId: 'tool', serviceName: 'test-service', kind: 'SPAN_KIND_INTERNAL' }]
      );
      expect(screen.getByTestId('spanDependencyIcon')).toHaveAttribute('aria-label', 'External');
    });

    it('shows the brand mark for known systems, else the category glyph', () => {
      const brand = renderItem({
        kind: 'SPAN_KIND_CLIENT',
        attributes: { db_system: 'postgresql', 'server.address': 'pg' },
      });
      expect(screen.getByTestId('spanDependencyIcon')).toHaveClass(
        'exploreSpanDetailTable__dependencyBrandIcon'
      );
      brand.unmount();
      // No open-source mark for IBM Db2: the database glyph, not a look-alike.
      const db2 = renderItem({
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'db.system': 'db2', 'server.address': 'db2-1' },
      });
      expect(screen.getByTestId('spanDependencyIcon')).not.toHaveClass(
        'exploreSpanDetailTable__dependencyBrandIcon'
      );
      db2.unmount();
      // SQL Server ships a light version, rendered alongside for dark mode.
      renderItem({
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'db.system': 'mssql', 'server.address': 'sql1' },
      });
      expect(screen.getByTestId('spanDependencyIcon')).toHaveClass(
        'exploreSpanDetailTable__dependencyBrandIcon--hasDarkTheme'
      );
      expect(screen.getByTestId('spanDependencyIconDark')).toBeInTheDocument();
    });

    it('does not mark service spans, CLIENT spans reaching another service, or raw-IP peers', () => {
      const { unmount } = renderItem({ kind: 'SPAN_KIND_SERVER' });
      expect(screen.queryByTestId('spanDependencyIcon')).not.toBeInTheDocument();
      unmount();
      const withChild = renderItem(
        { kind: 'SPAN_KIND_CLIENT', attributes: { 'http.url': 'http://frontend-proxy:8080/api' } },
        [{ spanId: 'child', serviceName: 'frontend-proxy', kind: 'SPAN_KIND_SERVER' }]
      );
      expect(screen.queryByTestId('spanDependencyIcon')).not.toBeInTheDocument();
      withChild.unmount();
      // A call answered by a SERVER span of its own service is a service edge too (backend).
      const selfCall = renderItem(
        { kind: 'SPAN_KIND_CLIENT', attributes: { 'http.url': 'http://frontend-proxy:8080/api' } },
        [{ spanId: 'self', serviceName: 'test-service', kind: 'SPAN_KIND_SERVER' }]
      );
      expect(screen.queryByTestId('spanDependencyIcon')).not.toBeInTheDocument();
      selfCall.unmount();
      renderItem({
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'server.address': '172.18.0.4', 'server.port': 8003 },
      });
      expect(screen.queryByTestId('spanDependencyIcon')).not.toBeInTheDocument();
    });
  });
});
