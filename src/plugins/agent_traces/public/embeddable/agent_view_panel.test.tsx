/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { AgentViewPanel, isAgentView } from './agent_view_panel';
import { TraceRow } from '../application/pages/traces/hooks/tree_utils';
import { SessionRow } from '../application/pages/sessions/session_utils';

const trace = {
  id: 's1',
  spanId: 's1',
  traceId: 't1',
  parentSpanId: null,
  status: 'success',
  kind: 'invoke_agent',
  name: 'POST /plan',
  input: 'Plan a trip',
  output: 'Sure',
  startTime: '',
  endTime: '',
  latency: '2.1s',
  durationNanos: 2.1e9,
  totalTokens: 10,
  inputTokens: 5,
  outputTokens: 5,
  totalCost: '—',
} as TraceRow;

const session = {
  sessionId: 'sess_1',
  startTime: '2026-09-29 10:00:00',
  endTime: '2026-09-29 10:01:00',
  durationMs: 60000,
  totalTraces: 2,
  errorTraces: 0,
  totalTokens: 100,
  firstMessage: 'Hi',
  lastMessage: 'Bye',
  userId: null,
  traceIds: ['t1', 't2'],
} as unknown as SessionRow;

const base = {
  formatTs: (ts: string) => ts,
  onOpenTrace: jest.fn(),
  onOpenSession: jest.fn(),
};

describe('AgentViewPanel', () => {
  it('recognizes agent tabs', () => {
    expect(isAgentView('sessions')).toBe(true);
    expect(isAgentView('visualization')).toBe(false);
  });

  it('renders traces and opens a trace on click', () => {
    const onOpenTrace = jest.fn();
    render(<AgentViewPanel {...base} view="traces" rows={[trace]} onOpenTrace={onOpenTrace} />);
    expect(screen.getByText('1 trace')).toBeInTheDocument();
    fireEvent.click(screen.getByText('POST /plan'));
    expect(onOpenTrace).toHaveBeenCalledWith(trace);
  });

  it('renders sessions with a capped count and opens a session on click', () => {
    const onOpenSession = jest.fn();
    render(
      <AgentViewPanel
        {...base}
        view="sessions"
        sessions={[session]}
        total={40}
        onOpenSession={onOpenSession}
      />
    );
    expect(screen.getByText('1 of 40 sessions')).toBeInTheDocument();
    fireEvent.click(screen.getByText('sess_1'));
    expect(onOpenSession).toHaveBeenCalledWith(session);
  });

  it('shows an error', () => {
    render(<AgentViewPanel {...base} view="sessions" error="boom" />);
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
