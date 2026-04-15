/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { FlyoutDetailPanel, formatJsonOrString } from './flyout_detail_panel';
import { TreeNode } from './tree_helpers';
import { TraceRow } from '../hooks/tree_utils';

describe('formatJsonOrString', () => {
  it('returns "(no data)" for empty or dash values', () => {
    expect(formatJsonOrString(undefined)).toBe('(no data)');
    expect(formatJsonOrString('—')).toBe('(no data)');
    expect(formatJsonOrString('')).toBe('(no data)');
  });

  it('pretty-prints valid JSON', () => {
    const input = '{"key":"value"}';
    const result = formatJsonOrString(input);
    expect(result).toBe('{\n  "key": "value"\n}');
  });

  it('returns raw string for non-JSON', () => {
    expect(formatJsonOrString('just a string')).toBe('just a string');
  });
});

describe('FlyoutDetailPanel', () => {
  const mockTraceRow: TraceRow = {
    id: 'span-1',
    spanId: 'span-1-full-id-abcdef',
    traceId: 'trace-1',
    parentSpanId: 'parent-1',
    status: 'success',
    kind: 'chat',
    name: 'Test Span',
    input: '{"prompt":"hello"}',
    output: '{"response":"world"}',
    startTime: '01/01/2025, 12:00:00 AM',
    endTime: '01/01/2025, 12:00:01 AM',
    latency: '150ms',
    durationNanos: 150000000,
    totalTokens: 200,
    inputTokens: 100,
    outputTokens: 100,
    totalCost: '—',
  };

  const mockTreeNode: TreeNode = {
    id: 'span-1',
    label: 'Test Span Label',
    children: [],
    traceRow: mockTraceRow,
  };

  it('renders the selected node label', () => {
    render(
      <FlyoutDetailPanel
        selectedNode={mockTreeNode}
        selectedTraceRow={mockTraceRow}
        onSelectNode={jest.fn()}
      />
    );

    expect(screen.getByText('Test Span Label')).toBeInTheDocument();
  });

  it('renders metadata fields', () => {
    render(
      <FlyoutDetailPanel
        selectedNode={mockTreeNode}
        selectedTraceRow={mockTraceRow}
        onSelectNode={jest.fn()}
      />
    );

    expect(screen.getByText(/Operation:/)).toBeInTheDocument();
    expect(screen.getByText('chat')).toBeInTheDocument();
    expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('renders dash placeholders when no node is selected', () => {
    render(
      <FlyoutDetailPanel
        selectedNode={undefined}
        selectedTraceRow={undefined}
        onSelectNode={jest.fn()}
      />
    );

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders span ID in a badge', () => {
    render(
      <FlyoutDetailPanel
        selectedNode={mockTreeNode}
        selectedTraceRow={mockTraceRow}
        onSelectNode={jest.fn()}
      />
    );

    expect(screen.getByText(/Span ID:/)).toBeInTheDocument();
    expect(screen.getByText('span-1-full-id-abcdef')).toBeInTheDocument();
  });
});
