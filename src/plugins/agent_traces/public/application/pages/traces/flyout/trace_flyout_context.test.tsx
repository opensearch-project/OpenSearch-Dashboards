/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TraceFlyoutProvider, useTraceFlyout } from './trace_flyout_context';
import { TraceRow } from '../hooks/use_agent_traces';

jest.mock('./trace_details_flyout', () => ({
  TraceDetailsFlyout: ({ trace, onClose }: any) => (
    <div data-test-subj="mock-flyout">
      <span>{trace.name}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

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
});
