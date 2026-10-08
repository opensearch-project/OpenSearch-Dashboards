/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { SessionDetailsFlyout, errorSpanCount, turnRole } from './session_details_flyout';
import { SessionTrace } from './hooks/use_session_detail';
import { SessionRow } from './session_utils';

const mockTraces = ['t1', 't2', 't3'].map((traceId, i) => ({
  traceId,
  root: {
    id: traceId,
    traceId,
    spanId: `s${i}`,
    status: 'success',
    name: `trace ${i + 1}`,
    input: '',
    output: '',
  },
  tree: [],
  spans: [],
}));
jest.mock('./hooks/use_session_detail', () => ({
  useSessionDetail: () => ({ traces: mockTraces, loading: false, error: null }),
}));
const mockOpenFlyout = jest.fn();
const mockUpdateTree = jest.fn();
jest.mock('../traces/flyout/trace_flyout_state', () => ({
  useTraceFlyout: () => ({ openFlyout: mockOpenFlyout, updateFlyoutFullTree: mockUpdateTree }),
}));

const msgs = (...roles: string[]) =>
  JSON.stringify(roles.map((role) => ({ role, parts: [{ type: 'text', content: role }] })));

describe('turnRole', () => {
  it('uses the last user message role for input and the first generation for output', () => {
    expect(turnRole(msgs('system', 'user', 'assistant', 'user'), 'input')).toBe('user');
    expect(turnRole(msgs('system', 'tool'), 'input')).toBe('tool');
    expect(turnRole(msgs('assistant'), 'output')).toBe('assistant');
  });

  it('falls back to user/assistant for non-schema values', () => {
    expect(turnRole('plain text', 'input')).toBe('user');
    expect(turnRole(undefined, 'output')).toBe('assistant');
  });
});

describe('errorSpanCount', () => {
  it('counts error spans in a trace', () => {
    const trace = {
      traceId: 't1',
      root: { status: 'success' },
      tree: [],
      spans: [{ status: 'success' }, { status: 'error' }, { status: 'error' }],
    } as unknown as SessionTrace;
    expect(errorSpanCount(trace)).toBe(2);
    expect(
      errorSpanCount({ ...trace, spans: [{ status: 'success' }] } as unknown as SessionTrace)
    ).toBe(0);
  });
});

describe('SessionDetailsFlyout', () => {
  const session = {
    sessionId: 'sess-1',
    traceIds: ['t1', 't2', 't3'],
    totalTraces: 3,
    totalTokens: 10,
    durationMs: 1000,
  } as unknown as SessionRow;

  it('focuses the trace the user came back from', () => {
    render(
      <SessionDetailsFlyout
        session={session}
        focusTraceId="t3"
        formatTs={(t) => t}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByTestId('agentTracesSessionTraceItem-3')).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('opens a trace as a step in the flyout history and shows Back/Forward', () => {
    const onBack = jest.fn();
    render(
      <SessionDetailsFlyout
        session={session}
        formatTs={(t) => t}
        onClose={jest.fn()}
        navigation={{ forward: { kind: 'trace', label: 'trace 2' }, onBack, onForward: jest.fn() }}
      />
    );
    expect(screen.getByTestId('agentTracesSessionTraceItem-1')).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByText('Forward to trace')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('agentTracesSessionOpenTrace-2'));
    // The opened trace's loading state is always settled with the tree it has.
    expect(mockUpdateTree).toHaveBeenCalledWith('t2', mockTraces[1].tree, false);
    expect(mockOpenFlyout).toHaveBeenCalledWith(mockTraces[1].root, {
      fromSession: session,
      sessionView: { view: 'overview', drillTab: 'traces' },
    });
  });

  it('opens on the view and tab the user left the session on', () => {
    render(
      <SessionDetailsFlyout
        session={session}
        sessionView={{ view: 'all', drillTab: 'spans' }}
        formatTs={(t) => t}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByTestId('agentTracesSessionViewAllTraces')).not.toBeInTheDocument();
  });
});
