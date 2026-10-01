/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { TraceDetailsFlyout, TraceDetailsProps, sessionIdOf } from './trace_details_flyout';
import { TraceRow } from '../hooks/tree_utils';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (
      _key: string,
      opts: { defaultMessage: string; values?: Record<string, string> }
    ) => {
      let msg = opts.defaultMessage;
      if (opts.values) {
        Object.entries(opts.values).forEach(([k, v]) => {
          msg = msg.replace(`{${k}}`, String(v));
        });
      }
      return msg;
    },
  },
}));

jest.mock('../flow/trace_flow_view', () => ({
  TraceFlowView: () => <div data-test-subj="mock-flow-view">Flow View</div>,
}));

jest.mock('./trace_tree_view', () => ({
  TraceTreeView: ({ expandedNodes, onCollapseAll }: any) => (
    <div data-test-subj="mock-tree-view">
      Tree View <span data-test-subj="mock-expanded">{expandedNodes.size}</span>
      <button onClick={onCollapseAll}>Collapse all</button>
    </div>
  ),
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

const mockTraceLogs = {
  logDatasets: [{ id: 'logs-1', title: 'logs-otel-v1*', type: 'INDEX_PATTERN' }],
  datasetLogs: {},
  logCount: 3,
  isLoading: false,
  traceDataset: null,
};
jest.mock('./use_trace_logs', () => ({
  useTraceLogs: jest.fn(() => mockTraceLogs),
}));

jest.mock('../../../../../../explore/public', () => ({
  TraceLogsTab: ({
    traceId,
    onSpanClick,
  }: {
    traceId: string;
    onSpanClick: (id: string) => void;
  }) => (
    <button data-test-subj="mock-trace-logs" onClick={() => onSpanClick('span-1')}>
      logs for {traceId}
    </button>
  ),
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
  durationNanos: 1000000000,
  totalTokens: 100,
  inputTokens: 50,
  outputTokens: 50,
  totalCost: '—',
};

const defaultProps: TraceDetailsProps = {
  trace: mockTrace,
  onClose: jest.fn(),
};

describe('TraceDetailsFlyout', () => {
  it('renders trace name in header', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByText('Trace: Test Agent Trace')).toBeInTheDocument();
  });

  it('renders Success status for success status', () => {
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders Error status for error status', () => {
    const errorTrace = { ...mockTrace, status: 'error' as const };
    render(<TraceDetailsFlyout {...defaultProps} trace={errorTrace} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
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

    expect(screen.getByText('Trace: Test Agent Trace')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.queryByText('invoke_agent')).not.toBeInTheDocument();
  });
});

describe('sessionIdOf', () => {
  it('returns the first span session id, flat or nested', () => {
    expect(
      sessionIdOf([
        { rawDocument: { attributes: {} } } as any,
        { rawDocument: { attributes: { gen_ai: { conversation: { id: 'sess-1' } } } } } as any,
        { rawDocument: { attributes: { 'gen_ai.conversation.id': 'sess-2' } } } as any,
      ])
    ).toBe('sess-1');
    expect(sessionIdOf([undefined, { rawDocument: {} } as any])).toBeUndefined();
  });

  it("keeps the user's collapsed tree when the same tree is sent again", () => {
    const child = { ...mockTrace, id: 'child', spanId: 'child', parentSpanId: 'span-1' };
    const tree = () => [{ ...mockTrace, children: [child] }] as TraceRow[];
    const { rerender } = render(<TraceDetailsFlyout {...defaultProps} fullTree={tree()} />);
    expect(screen.getByTestId('mock-expanded')).not.toHaveTextContent(/^0$/);
    fireEvent.click(screen.getByText('Collapse all'));
    expect(screen.getByTestId('mock-expanded')).toHaveTextContent(/^0$/);
    // The traces table re-sends the tree (new array, same spans), e.g. on a cache sync.
    rerender(<TraceDetailsFlyout {...defaultProps} fullTree={tree()} />);
    expect(screen.getByTestId('mock-expanded')).toHaveTextContent(/^0$/);
  });

  it('adds a Related logs tab with the trace log count, keyed on the trace id', () => {
    const { useTraceLogs } = jest.requireMock('./use_trace_logs');
    render(<TraceDetailsFlyout {...defaultProps} />);
    expect(useTraceLogs).toHaveBeenCalledWith('trace-id-abc');
    const tab = screen.getByTestId('agentTracesFlyoutLogsTab');
    expect(tab).toHaveTextContent('3');
    expect(tab).toHaveTextContent('Related logs');
    fireEvent.click(tab);
    expect(screen.getByTestId('mock-trace-logs')).toHaveTextContent('logs for trace-id-abc');
  });
});
