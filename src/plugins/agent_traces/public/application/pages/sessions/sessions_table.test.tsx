/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { SessionsTable } from './sessions_table';
import { SessionRow } from './session_utils';

const session = (overrides: Partial<SessionRow> = {}): SessionRow => ({
  sessionId: 'sess_1',
  startTime: '2026-09-28 22:17:18.659',
  endTime: '2026-09-28 22:17:27.692',
  durationMs: 9033,
  totalTraces: 3,
  totalTokens: 8016,
  firstMessage: 'Plan a trip to Paris',
  lastMessage: 'Great choice! Paris looks wonderful.',
  userId: null,
  traceIds: ['t1', 't2', 't3'],
  ...overrides,
});

describe('SessionsTable', () => {
  const formatTs = (ts: string) => `fmt(${ts})`;

  it('renders session rows with messages, counts and tokens', () => {
    render(
      <SessionsTable
        sessions={[session()]}
        formatTs={formatTs}
        wrapCellText={false}
        onSessionClick={jest.fn()}
      />
    );
    expect(screen.getByText('fmt(2026-09-28 22:17:18.659)')).toBeInTheDocument();
    expect(screen.getByText('sess_1')).toBeInTheDocument();
    expect(screen.getByText('Plan a trip to Paris')).toBeInTheDocument();
    expect(screen.getByText('Great choice! Paris looks wonderful.')).toBeInTheDocument();
    expect(screen.getByText('9.0s')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('8,016')).toBeInTheDocument();
  });

  it('shows a dash for missing tokens', () => {
    render(
      <SessionsTable
        sessions={[session({ totalTokens: null })]}
        formatTs={formatTs}
        wrapCellText={false}
        onSessionClick={jest.fn()}
      />
    );
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('hides the User ID column unless a session has a user id', () => {
    const { rerender } = render(
      <SessionsTable
        sessions={[session()]}
        formatTs={formatTs}
        wrapCellText={false}
        onSessionClick={jest.fn()}
      />
    );
    expect(screen.queryByText('User ID')).not.toBeInTheDocument();

    rerender(
      <SessionsTable
        sessions={[session({ userId: 'user-42' })]}
        formatTs={formatTs}
        wrapCellText={false}
        onSessionClick={jest.fn()}
      />
    );
    expect(screen.getAllByText('User ID').length).toBeGreaterThan(0);
    expect(screen.getByText('user-42')).toBeInTheDocument();
  });

  it('calls onSessionClick when the time link is clicked', () => {
    const onSessionClick = jest.fn();
    const row = session();
    render(
      <SessionsTable
        sessions={[row]}
        formatTs={formatTs}
        wrapCellText={false}
        onSessionClick={onSessionClick}
      />
    );
    fireEvent.click(screen.getByTestId('agentTracesSessionTimeLink'));
    expect(onSessionClick).toHaveBeenCalledWith(row);
  });
});
