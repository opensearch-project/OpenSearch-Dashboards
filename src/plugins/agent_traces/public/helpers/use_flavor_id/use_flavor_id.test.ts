/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { Subject } from 'rxjs';
import { useFlavorId } from './use_flavor_id';
import { AgentTracesFlavor } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

// Mock the useOpenSearchDashboards hook
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

describe('useFlavorId', () => {
  let currentAppIdSubject: Subject<string>;

  beforeEach(() => {
    // Reset the subject before each test
    currentAppIdSubject = new Subject<string>();

    // Setup the mock implementation
    (useOpenSearchDashboards as jest.Mock).mockImplementation(() => ({
      services: {
        core: {
          application: {
            currentAppId$: currentAppIdSubject,
          },
        },
      },
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no app ID is provided', () => {
    const { result } = renderHook(() => useFlavorId());
    expect(result.current).toBe(AgentTracesFlavor.Traces);
  });

  it('should extract flavor ID from agent traces app ID', () => {
    const { result } = renderHook(() => useFlavorId());

    // Use act() to flush React state updates from the Observable subscription
    act(() => {
      currentAppIdSubject.next('agentTraces/logs');
    });

    expect(result.current).toBe('logs');
  });

  it('should handle multiple app ID changes', () => {
    const { result } = renderHook(() => useFlavorId());

    // Use act() to flush React state updates from the Observable subscription
    act(() => {
      currentAppIdSubject.next('agentTraces/logs');
    });
    expect(result.current).toBe('logs');

    act(() => {
      currentAppIdSubject.next('agentTraces/metrics');
    });
    expect(result.current).toBe('metrics');
  });

  it('should handle invalid app IDs', () => {
    const { result } = renderHook(() => useFlavorId());

    // Use act() to flush React state updates from the Observable subscription
    act(() => {
      currentAppIdSubject.next('invalid-app-id');
    });
    expect(result.current).toBeNull();
  });

  it('should cleanup subscription on unmount', () => {
    const unsubscribeSpy = jest.fn();
    const mockSubscribe = jest.fn(() => ({ unsubscribe: unsubscribeSpy }));

    (useOpenSearchDashboards as jest.Mock).mockImplementation(() => ({
      services: {
        core: {
          application: {
            currentAppId$: { subscribe: mockSubscribe },
          },
        },
      },
    }));

    const { unmount } = renderHook(() => useFlavorId());

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
