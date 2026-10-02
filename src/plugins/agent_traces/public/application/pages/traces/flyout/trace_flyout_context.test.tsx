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

jest.mock('./trace_details_flyout', () => ({
  TraceDetailsFlyout: ({ trace, onClose, onOpenSession, navigation, isLoadingFullTree }: any) => (
    <div data-test-subj="mock-flyout">
      <span>{trace.name}</span>
      <span>{isLoadingFullTree ? 'tree loading' : 'tree loaded'}</span>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onOpenSession('sess-from-trace')}>Session link</button>
      <NavButtons navigation={navigation} />
    </div>
  ),
}));

const mockSessionMounts = jest.fn();
jest.mock('../../sessions/session_flyout_host', () => ({
  SessionFlyoutHost: ({ sessionId, focusTraceId, navigation }: any) => {
    jest.requireActual('react').useEffect(() => {
      mockSessionMounts(sessionId);
    }, []);
    return (
      <div data-test-subj="mock-session-flyout">
        <span data-test-subj="mock-session-id">{sessionId}</span>
        <span data-test-subj="mock-session-focus">{focusTraceId ?? 'none'}</span>
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
          <button onClick={() => openSession({ sessionId: 'sess-a' } as any)}>Open A</button>
          <button onClick={() => openSession('sess-b')}>Open B</button>
          <button
            onClick={() => openFlyout(mockTrace, { fromSession: { sessionId: 'sess-a' } as any })}
          >
            Trace from A
          </button>
          <button onClick={() => updateFlyoutFullTree([mockTrace], false)}>Tree loaded</button>
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
