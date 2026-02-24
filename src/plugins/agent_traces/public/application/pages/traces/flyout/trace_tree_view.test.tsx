/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceTreeView, TraceTreeViewProps } from './trace_tree_view';
import { TreeNode } from './tree_helpers';

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => <>{defaultMessage}</>,
}));

jest.mock('@osd/ui-shared-deps/theme', () => ({
  euiThemeVars: {
    euiColorLightestShade: '#f5f7fa',
    euiColorPrimary: '#006BB4',
  },
}));

jest.mock('../../../../services/span_categorization', () => ({
  getSpanCategory: jest.fn(() => 'AGENT'),
  getCategoryBadgeStyle: jest.fn(() => ({ backgroundColor: '#eee', color: '#333' })),
  hexToRgba: jest.fn(() => 'rgba(0,0,0,0.1)'),
}));

const makeNode = (overrides: Partial<TreeNode> = {}): TreeNode => ({
  id: 'node-1',
  label: 'Test Node',
  latency: '150ms',
  tokens: 50,
  ...overrides,
});

const defaultProps: TraceTreeViewProps = {
  traceTreeData: [makeNode()],
  selectedNode: undefined,
  expandedNodes: new Set(),
  onSelectNode: jest.fn(),
  onToggleExpanded: jest.fn(),
};

describe('TraceTreeView', () => {
  it('renders loading state', () => {
    render(<TraceTreeView {...defaultProps} isLoadingFullTree={true} />);
    expect(screen.getByText('Loading full trace tree...')).toBeInTheDocument();
  });

  it('renders tree nodes', () => {
    render(<TraceTreeView {...defaultProps} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders token badge when tokens > 0', () => {
    render(<TraceTreeView {...defaultProps} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders latency text', () => {
    render(<TraceTreeView {...defaultProps} />);
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('calls onSelectNode when row is clicked', () => {
    const onSelectNode = jest.fn();
    render(<TraceTreeView {...defaultProps} onSelectNode={onSelectNode} />);
    fireEvent.click(screen.getByText('Test Node'));
    expect(onSelectNode).toHaveBeenCalledWith('node-1');
  });

  it('renders expand icon for nodes with children', () => {
    const parent = makeNode({
      id: 'parent',
      children: [makeNode({ id: 'child', label: 'Child Node' })],
    });
    render(<TraceTreeView {...defaultProps} traceTreeData={[parent]} />);
    const icons = document.querySelectorAll('[data-euiicon-type]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders children when expanded', () => {
    const parent = makeNode({
      id: 'parent',
      label: 'Parent',
      children: [makeNode({ id: 'child', label: 'Child Node' })],
    });
    render(
      <TraceTreeView
        {...defaultProps}
        traceTreeData={[parent]}
        expandedNodes={new Set(['parent'])}
      />
    );
    expect(screen.getByText('Child Node')).toBeInTheDocument();
  });

  it('does not render children when collapsed', () => {
    const parent = makeNode({
      id: 'parent',
      label: 'Parent',
      children: [makeNode({ id: 'child', label: 'Child Node' })],
    });
    render(<TraceTreeView {...defaultProps} traceTreeData={[parent]} expandedNodes={new Set()} />);
    expect(screen.queryByText('Child Node')).not.toBeInTheDocument();
  });

  it('applies selected class to selected node', () => {
    const node = makeNode();
    render(<TraceTreeView {...defaultProps} traceTreeData={[node]} selectedNode={node} />);
    const selected = document.querySelector('.agentTracesFlyout__treeRow--selected');
    expect(selected).toBeTruthy();
  });
});
