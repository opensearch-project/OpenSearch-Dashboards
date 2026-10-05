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
};
jest.mock('./hooks/use_sessions', () => ({
  useSessions: () => mockSessionsResult,
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

const mockMounts = jest.fn();
jest.mock('./session_details_flyout', () => ({
  SessionDetailsFlyout: ({ session: s }: { session: SessionRow }) => {
    jest.requireActual('react').useEffect(() => {
      mockMounts(s.sessionId);
    }, []);
    return <div data-test-subj="flyout">{s.sessionId}</div>;
  },
}));

describe('SessionsTab', () => {
  it('opens a fresh flyout when another session is selected', () => {
    render(<SessionsTab />);
    fireEvent.click(screen.getByText('s1'));
    fireEvent.click(screen.getByText('s2'));
    // Without a key the instance (and its focused trace / view state) would be reused.
    expect(mockMounts).toHaveBeenCalledTimes(2);
    expect(mockMounts).toHaveBeenLastCalledWith('s2');
    expect(screen.getByTestId('flyout')).toHaveTextContent('s2');
  });
});
