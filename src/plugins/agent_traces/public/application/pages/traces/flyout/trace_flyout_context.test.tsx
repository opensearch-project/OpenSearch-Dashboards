/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TraceFlyoutProvider, useTraceFlyout } from './trace_flyout_context';
import { TraceRow } from '../hooks/tree_utils';

jest.mock('./trace_details_flyout', () => ({
  TraceDetailsFlyout: ({ trace, onClose, onOpenSession, fromSession }: any) => (
    <div data-test-subj="mock-flyout">
      <span>{trace.name}</span>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onOpenSession('sess-from-trace')}>Session link</button>
      {fromSession && (
        <button onClick={() => onOpenSession(fromSession)}>Back to {fromSession.sessionId}</button>
      )}
    </div>
  ),
}));

const mockSessionMounts = jest.fn();
jest.mock('../../sessions/session_flyout_host', () => ({
  SessionFlyoutHost: ({ sessionId }: { sessionId: string }) => {
    jest.requireActual('react').useEffect(() => {
      mockSessionMounts(sessionId);
    }, []);
    return <div data-test-subj="mock-session-flyout">{sessionId}</div>;
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

  describe('one flyout at a time', () => {
    const Controls = () => {
      const { openFlyout, openSession } = useTraceFlyout();
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
        </>
      );
    };

    beforeEach(() => mockSessionMounts.mockClear());

    it('replaces the trace flyout with its session and back, never stacking', () => {
      render(
        <TraceFlyoutProvider>
          <Controls />
        </TraceFlyoutProvider>
      );
      act(() => screen.getByText('Open trace').click());
      act(() => screen.getByText('Session link').click());
      expect(screen.queryByTestId('mock-flyout')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-session-flyout')).toHaveTextContent('sess-from-trace');

      act(() => screen.getByText('Trace from A').click());
      expect(screen.queryByTestId('mock-session-flyout')).not.toBeInTheDocument();
      act(() => screen.getByText('Back to sess-a').click());
      expect(screen.getByTestId('mock-session-flyout')).toHaveTextContent('sess-a');
      expect(screen.queryByTestId('mock-flyout')).not.toBeInTheDocument();
    });

    it('gives each session a fresh flyout', () => {
      render(
        <TraceFlyoutProvider>
          <Controls />
        </TraceFlyoutProvider>
      );
      act(() => screen.getByText('Open A').click());
      act(() => screen.getByText('Open B').click());
      expect(mockSessionMounts.mock.calls.map(([id]) => id)).toEqual(['sess-a', 'sess-b']);
    });
  });
});
