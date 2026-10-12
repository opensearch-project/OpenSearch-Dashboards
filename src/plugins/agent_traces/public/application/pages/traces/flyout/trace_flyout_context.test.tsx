/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TraceFlyoutProvider, useTraceFlyout } from './trace_flyout_context';
import { TraceRow } from '../hooks/tree_utils';

const NavButtons = ({ navigation }: any) => (
  <>
    {navigation?.back && (
      <button onClick={navigation.onBack}>
        Back to {navigation.back.kind} {navigation.back.label}
      </button>
    )}
    {navigation?.forward && (
      <button onClick={navigation.onForward}>
        Forward to {navigation.forward.kind} {navigation.forward.label}
      </button>
    )}
  </>
);

const mockTraceMounts = jest.fn();
jest.mock('./trace_details_flyout', () => ({
  TraceDetailsFlyout: ({
    trace,
    onClose,
    onOpenSession,
    navigation,
    isLoadingFullTree,
    fullTree,
  }: any) => {
    jest.requireActual('react').useEffect(() => {
      mockTraceMounts(trace.name);
    }, []);
    return (
      <div data-test-subj="mock-flyout">
        <span>{trace.name}</span>
        <span>{isLoadingFullTree ? 'tree loading' : 'tree loaded'}</span>
        <span data-test-subj="mock-tree">{fullTree?.[0]?.name ?? 'no tree'}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onOpenSession('sess-from-trace')}>Session link</button>
        <button onClick={() => onOpenSession('sess-a')}>Session link A</button>
        <NavButtons navigation={navigation} />
      </div>
    );
  },
}));

const mockSessionMounts = jest.fn();
jest.mock('../../sessions/session_flyout_host', () => ({
  SessionFlyoutHost: ({
    sessionId,
    session,
    focusTraceId,
    sessionView,
    navigation,
    onLoaded,
  }: any) => {
    jest.requireActual('react').useEffect(() => {
      mockSessionMounts(sessionId);
    }, []);
    return (
      <div data-test-subj="mock-session-flyout">
        <span data-test-subj="mock-session-id">{sessionId}</span>
        <span data-test-subj="mock-session-focus">{focusTraceId ?? 'none'}</span>
        <span data-test-subj="mock-session-view">{sessionView?.view ?? 'none'}</span>
        <span data-test-subj="mock-session-cached">{session ? 'cached' : 'not cached'}</span>
        <button onClick={() => onLoaded({ sessionId, traceIds: [] })}>Fetched {sessionId}</button>
        <NavButtons navigation={navigation} />
      </div>
    );
  },
}));

// @ts-expect-error TS2739 TODO(ts-error): fixme
const mockTrace: TraceRow = {
  id: 'trace-1',
  spanId: 'span-1',
  traceId: 'trace-id-1',
  parentSpanId: null,
  status: 'success',
  kind: 'chat',
  name: 'Test Trace',
  input: '',
  output: '',
  startTime: '',
  endTime: '',
  latency: '100ms',
  totalTokens: 10,
  totalCost: '—',
};

const mockTraceB: TraceRow = {
  ...mockTrace,
  id: 'trace-2',
  spanId: 'span-2',
  traceId: 'trace-id-2',
  name: 'Trace B',
};

describe('TraceFlyoutContext', () => {
  describe('useTraceFlyout', () => {
    it('throws when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useTraceFlyout())).toThrow(
        'useTraceFlyout must be used within a TraceFlyoutProvider'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('TraceFlyoutProvider', () => {
    it('renders children', () => {
      render(
        <TraceFlyoutProvider>
          <div data-test-subj="child">Hello</div>
        </TraceFlyoutProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('does not render flyout initially', () => {
      render(
        <TraceFlyoutProvider>
          <div>Content</div>
        </TraceFlyoutProvider>
      );
      expect(screen.queryByTestId('mock-flyout')).not.toBeInTheDocument();
    });

    it('opens flyout when openFlyout is called', () => {
      const TestComponent = () => {
        const { openFlyout } = useTraceFlyout();
        return <button onClick={() => openFlyout(mockTrace)}>Open</button>;
      };

      render(
        <TraceFlyoutProvider>
          <TestComponent />
        </TraceFlyoutProvider>
      );

      act(() => {
        screen.getByText('Open').click();
      });

      expect(screen.getByTestId('mock-flyout')).toBeInTheDocument();
      expect(screen.getByText('Test Trace')).toBeInTheDocument();
    });

    it('closes flyout when closeFlyout is called', () => {
      const TestComponent = () => {
        const { openFlyout } = useTraceFlyout();
        return <button onClick={() => openFlyout(mockTrace)}>Open</button>;
      };

      render(
        <TraceFlyoutProvider>
          <TestComponent />
        </TraceFlyoutProvider>
      );

      act(() => {
        screen.getByText('Open').click();
      });
      expect(screen.getByTestId('mock-flyout')).toBeInTheDocument();

      act(() => {
        screen.getByText('Close').click();
      });
      expect(screen.queryByTestId('mock-flyout')).not.toBeInTheDocument();
    });
  });

  describe('one flyout at a time, with history', () => {
    const Controls = () => {
      const { openFlyout, openSession, updateFlyoutFullTree } = useTraceFlyout();
      return (
        <>
          <button onClick={() => openFlyout(mockTrace)}>Open trace</button>
          <button onClick={() => openFlyout(mockTraceB)}>Open trace B</button>
          <button onClick={() => openSession({ sessionId: 'sess-a' } as any)}>Open A</button>
          <button onClick={() => openSession('sess-b')}>Open B</button>
          <button
            onClick={() => openFlyout(mockTrace, { fromSession: { sessionId: 'sess-a' } as any })}
          >
            Trace from A
          </button>
          <button
            onClick={() =>
              openFlyout(mockTrace, {
                fromSession: { sessionId: 'sess-a' } as any,
                sessionView: { view: 'all', drillTab: 'spans' },
              })
            }
          >
            Trace from A all
          </button>
          <button onClick={() => updateFlyoutFullTree(mockTrace.traceId, [mockTrace], false)}>
            Tree loaded
          </button>
          <button
            onClick={() =>
              openFlyout(mockTraceB, { fromSession: { sessionId: 'sess-from-trace' } as any })
            }
          >
            Trace B from session
          </button>
          <button onClick={() => updateFlyoutFullTree(mockTraceB.traceId, [mockTraceB], false)}>
            Tree B loaded
          </button>
        </>
      );
    };
    const renderProvider = () =>
      render(
        <TraceFlyoutProvider>
          <Controls />
        </TraceFlyoutProvider>
      );
    const click = (text: string) => act(() => screen.getByText(text).click());

    beforeEach(() => mockSessionMounts.mockClear());

    it('follows the path: session -> trace -> back to session -> forward to trace', () => {
      renderProvider();
      click('Open A');
      expect(screen.queryByText(/^Back to/)).not.toBeInTheDocument();

      click('Trace from A');
      expect(screen.queryByTestId('mock-session-flyout')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-flyout')).toHaveTextContent('Test Trace');

      click('Back to session sess-a');
      expect(screen.queryByTestId('mock-flyout')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-session-id')).toHaveTextContent('sess-a');
      // The session comes back focused on the trace the user opened from it.
      expect(screen.getByTestId('mock-session-focus')).toHaveTextContent('trace-id-1');

      click('Forward to trace Test Trace');
      expect(screen.queryByTestId('mock-session-flyout')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-flyout')).toHaveTextContent('Test Trace');
      expect(screen.queryByText(/^Forward to/)).not.toBeInTheDocument();
    });

    it('keeps a tree that finished loading after the user went back', () => {
      renderProvider();
      click('Open A');
      click('Trace from A');
      click('Back to session sess-a');
      click('Tree loaded');
      click('Forward to trace Test Trace');
      expect(screen.getByTestId('mock-flyout')).toHaveTextContent('tree loaded');
    });

    it('writes a tree only to its own trace, even after the user moved on', () => {
      renderProvider();
      click('Open trace'); // trace A from the table, still loading
      click('Session link');
      click('Trace B from session');
      click('Tree B loaded');
      expect(screen.getByTestId('mock-tree')).toHaveTextContent('Trace B');

      // A's fetch finishes while B is shown: B keeps its own tree.
      click('Tree loaded');
      expect(screen.getByTestId('mock-tree')).toHaveTextContent('Trace B');

      // Back through the session to A: A has its own tree.
      click('Back to session sess-from-trace');
      click('Back to trace Test Trace');
      expect(screen.getByTestId('mock-tree')).toHaveTextContent('Test Trace');
    });

    it('restores the session view the trace was opened from', () => {
      renderProvider();
      click('Open A');
      click('Trace from A all');
      click('Back to session sess-a');
      expect(screen.getByTestId('mock-session-view')).toHaveTextContent('all');
    });

    it('keeps a session fetched by id for Back/Forward', () => {
      renderProvider();
      click('Open trace');
      click('Session link');
      expect(screen.getByTestId('mock-session-cached')).toHaveTextContent('not cached');
      click('Fetched sess-from-trace');
      click('Back to trace Test Trace');
      click('Forward to session sess-from-trace');
      expect(screen.getByTestId('mock-session-cached')).toHaveTextContent('cached');
    });

    it('gives each trace opened from a table a fresh flyout', () => {
      mockTraceMounts.mockClear();
      renderProvider();
      click('Open trace');
      click('Open trace B');
      // Both start a new history at index 0; the trace id in the key still remounts.
      expect(mockTraceMounts.mock.calls.map(([name]) => name)).toEqual(['Test Trace', 'Trace B']);
    });

    it('goes back instead of repeating the session a trace was opened from', () => {
      renderProvider();
      click('Open A'); // session sess-a
      click('Trace from A');
      // The trace's SESSION ID link points at the session it came from.
      act(() => screen.getByText('Session link A').click());
      expect(screen.getByTestId('mock-session-id')).toHaveTextContent('sess-a');
      expect(screen.queryByText(/^Back to/)).not.toBeInTheDocument();
      expect(screen.getByText('Forward to trace Test Trace')).toBeInTheDocument();
    });

    it('records trace -> session, and a new path drops the old forward entries', () => {
      renderProvider();
      click('Open trace');
      click('Session link');
      expect(screen.getByTestId('mock-session-id')).toHaveTextContent('sess-from-trace');
      click('Back to trace Test Trace');
      expect(screen.getByTestId('mock-flyout')).toBeInTheDocument();
      expect(screen.getByText('Forward to session sess-from-trace')).toBeInTheDocument();

      // Opening from a table starts over: no back or forward.
      click('Open B');
      expect(screen.getByTestId('mock-session-id')).toHaveTextContent('sess-b');
      expect(screen.queryByText(/^Back to|^Forward to/)).not.toBeInTheDocument();
    });

    it('gives each session a fresh flyout', () => {
      renderProvider();
      click('Open A');
      click('Open B');
      expect(mockSessionMounts.mock.calls.map(([id]) => id)).toEqual(['sess-a', 'sess-b']);
    });
  });
});
