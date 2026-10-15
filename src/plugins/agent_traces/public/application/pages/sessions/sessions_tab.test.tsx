/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { SessionsTab } from './sessions_tab';
import { SessionRow } from './session_utils';

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: () => ({ services: { uiSettings: { get: () => 'UTC' } } }),
}));

// Stable references: a new array per render would re-run effects on every render.
const mockSessionsResult = {
  sessions: [{ sessionId: 's1' }, { sessionId: 's2' }] as SessionRow[],
  loading: false,
  error: null,
  elapsedMs: 1,
  refresh: () => {},
  ignoredCommands: [],
  hasFilter: false,
  totalSessions: 2,
  partial: false,
  errorsPartial: false,
};
const mockUseSessions = jest.fn(
  (_formatTs: unknown, _onlyWithErrors?: boolean) => mockSessionsResult
);
jest.mock('./hooks/use_sessions', () => ({
  useSessions: (formatTs: unknown, onlyWithErrors?: boolean) =>
    mockUseSessions(formatTs, onlyWithErrors),
}));

jest.mock('./sessions_table', () => ({
  SessionsTable: ({
    sessions,
    onSessionClick,
  }: {
    sessions: SessionRow[];
    onSessionClick: (s: SessionRow) => void;
  }) => (
    <div>
      {sessions.map((s: SessionRow) => (
        <button key={s.sessionId} onClick={() => onSessionClick(s)}>
          {s.sessionId}
        </button>
      ))}
    </div>
  ),
}));

const mockOpenSession = jest.fn();
jest.mock('../traces/flyout/trace_flyout_state', () => ({
  useTraceFlyout: () => ({ openSession: mockOpenSession, activeSessionId: undefined }),
}));

describe('SessionsTab', () => {
  it('opens sessions in the shared Agent Traces flyout', () => {
    render(<SessionsTab />);
    fireEvent.click(screen.getByText('s2'));
    expect(mockOpenSession).toHaveBeenCalledWith({ sessionId: 's2' });
  });

  it('lists only sessions with errors when the switch is on', () => {
    render(<SessionsTab />);
    expect(mockUseSessions).toHaveBeenLastCalledWith(expect.any(Function), false);
    fireEvent.click(screen.getByTestId('agentTracesSessionsOnlyErrors'));
    expect(mockUseSessions).toHaveBeenLastCalledWith(expect.any(Function), true);
  });
});
