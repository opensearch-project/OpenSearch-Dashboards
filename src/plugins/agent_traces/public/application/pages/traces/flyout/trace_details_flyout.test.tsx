/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TraceDetailsFlyout, TraceDetailsProps } from './trace_details_flyout';
import { TraceRow } from '../hooks/use_agent_traces';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_key: string, opts: { defaultMessage: string }) => opts.defaultMessage,
  },
}));

jest.mock('../flow/trace_flow_view', () => ({
  TraceFlowView: () => <div data-test-subj="mock-flow-view">Flow View</div>,
}));

jest.mock('./trace_tree_view', () => ({
  TraceTreeView: () => <div data-test-subj="mock-tree-view">Tree View</div>,
}));

jest.mock('./timeline_gantt', () => ({
  TimelineGantt: () => <div data-test-subj="mock-timeline">Timeline</div>,
}));

jest.mock('./use_flyout_resize', () => ({
  useFlyoutResize: () => ({
    flyoutWidth: 1400,
    isResizingFlyout: false,
    handleFlyoutMouseDown: jest.fn(),
  }),
}));

jest.mock('./flyout_detail_panel', () => ({
  FlyoutDetailPanel: () => <div data-test-subj="mock-detail-panel">Detail Panel</div>,
}));

const mockTrace: TraceRow = {
  id: 'trace-1',
  spanId: 'span-1',
  traceId: 'trace-id-abc',
  parentSpanId: null,
  status: 'success',
  kind: 'chat',
  name: 'Test Agent Trace',
  input: 'hello',
  output: 'world',
  startTime: '01/01/2025, 12:00:00 AM',
  endTime: '01/01/2025, 12:00:01 AM',
  latency: '1s',
  totalTokens: 100,
  totalCost: '—',
};

const defaultProps: TraceDetailsProps = {
  trace: mockTrace,
  onClose: jest.fn(),
};

describe('TraceDetailsFlyout', () => {
  it('renders trace name in header', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByText('Test Agent Trace')).toBeInTheDocument();
  });

  it('renders SUCCESS badge for success status', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
  });

  it('renders ERROR badge for error status', () => {
    const errorTrace = { ...mockTrace, status: 'error' as const };
    render(<TraceDetailsFlyout {...defaultProps} trace={errorTrace} />);
    expect(screen.getByText('ERROR')).toBeInTheDocument();
  });

  it('renders trace ID', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByText('trace-id-abc')).toBeInTheDocument();
  });

  it('renders duration', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByText('DURATION')).toBeInTheDocument();
    expect(screen.getByText('1s')).toBeInTheDocument();
  });

  it('renders start time', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByText('01/01/2025, 12:00:00 AM')).toBeInTheDocument();
  });

  it('renders tab content areas', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByTestId('mock-detail-panel')).toBeInTheDocument();
  });

  it('renders root trace name and status in header when fullTree is provided', () => {
    const childTrace: TraceRow = {
      ...mockTrace,
      id: 'child-1',
      spanId: 'child-span-1',
      parentSpanId: 'span-1',
      name: 'invoke_agent',
      status: 'error',
    };
    const rootTrace: TraceRow = {
      ...mockTrace,
      children: [childTrace],
    };

    render(<TraceDetailsFlyout {...defaultProps} trace={childTrace} fullTree={[rootTrace]} />);

    expect(screen.getByText('Test Agent Trace')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.queryByText('invoke_agent')).not.toBeInTheDocument();
  });
});
