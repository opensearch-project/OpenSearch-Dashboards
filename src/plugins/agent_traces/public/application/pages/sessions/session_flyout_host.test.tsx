/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionFlyoutHost } from './session_flyout_host';
import { SessionRow } from './session_utils';

const mockFetchSessions = jest.fn();
jest.mock('./fetch_sessions', () => ({
  fetchSessions: (...args: unknown[]) => mockFetchSessions(...args),
}));

jest.mock('../traces/hooks/use_ppl_query_deps', () => ({
  usePPLQueryDeps: () => ({
    pplService: {},
    datasetParam: { id: 'd', title: 'otel-v1-apm-span*', type: 'INDEX_PATTERN' },
    baseQueryString: 'source = otel-v1-apm-span* | where serviceName = "x"',
  }),
}));

jest.mock('./session_details_flyout', () => ({
  SessionDetailsFlyout: ({ session, focusTraceId, sessionView }: any) => (
    <div data-test-subj="mock-session-details">
      {session.sessionId} focus={focusTraceId ?? 'none'} view={sessionView?.view ?? 'none'}
    </div>
  ),
}));

const row = { sessionId: 'sess-1', traceIds: ['t1'] } as unknown as SessionRow;
const props = { sessionId: 'sess-1', formatTs: (ts: string) => ts, onClose: jest.fn() };

describe('SessionFlyoutHost', () => {
  beforeEach(() => mockFetchSessions.mockReset());

  it('shows a loaded session without fetching it', () => {
    render(<SessionFlyoutHost {...props} session={row} focusTraceId="t1" />);
    expect(screen.getByTestId('mock-session-details')).toHaveTextContent('sess-1 focus=t1');
    expect(mockFetchSessions).not.toHaveBeenCalled();
  });

  it('fetches a session by id, shows it and hands it to onLoaded', async () => {
    mockFetchSessions.mockResolvedValue({ sessions: [row] });
    const onLoaded = jest.fn();
    render(
      <SessionFlyoutHost
        {...props}
        onLoaded={onLoaded}
        sessionView={{ view: 'all', drillTab: 'spans' }}
      />
    );
    expect(screen.getByTestId('agentTracesSessionFlyoutLoading')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('mock-session-details')).toHaveTextContent('view=all')
    );
    expect(onLoaded).toHaveBeenCalledWith(row);
    // Filters the source (not the user's query) by the session id.
    expect(mockFetchSessions.mock.calls[0][2]).toBe(
      'source = otel-v1-apm-span* | where `attributes.gen_ai.conversation.id` = "sess-1"'
    );
  });

  it('says when the session is not in the time range', async () => {
    mockFetchSessions.mockResolvedValue({ sessions: [] });
    render(<SessionFlyoutHost {...props} />);
    expect(
      await screen.findByText('Session sess-1 was not found in the selected time range.')
    ).toBeInTheDocument();
  });

  it('shows a fetch error', async () => {
    mockFetchSessions.mockRejectedValue(new Error('PPL failed'));
    render(<SessionFlyoutHost {...props} />);
    expect(await screen.findByText('PPL failed')).toBeInTheDocument();
  });

  it('ignores a fetch that finishes after unmount', async () => {
    let resolve: (value: unknown) => void = () => {};
    mockFetchSessions.mockReturnValue(new Promise((r) => (resolve = r)));
    const onLoaded = jest.fn();
    const { unmount } = render(<SessionFlyoutHost {...props} onLoaded={onLoaded} />);
    unmount();
    resolve({ sessions: [row] });
    await Promise.resolve();
    expect(onLoaded).not.toHaveBeenCalled();
  });
});
