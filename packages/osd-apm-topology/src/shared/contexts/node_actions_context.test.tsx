/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {} from '../../test_utils/vitest.utilities';
import { renderHook, act } from '@testing-library/react';
import {
  CelestialNodeActionsProvider,
  useCelestialNodeActionsContext,
} from './node_actions_context';

const mockFitViewWithDelay = jest.fn();
jest.mock('../hooks/use_fit_view_with_delay.hook', () => ({
  useFitViewWithDelay: () => mockFitViewWithDelay,
}));

const mockSetSelectedNodeId = jest.fn();
const mockSetUnstackedAggregateNodeIds = jest.fn();
jest.mock('./celestial_state_context', () => ({
  useCelestialStateContext: () => ({
    selectedNodeId: undefined,
    setSelectedNodeId: mockSetSelectedNodeId,
    unstackedAggregateNodeIds: [],
    setUnstackedAggregateNodeIds: mockSetUnstackedAggregateNodeIds,
  }),
}));

const mockGetNodes = jest.fn(() => []);
const mockGetEdges = jest.fn(() => []);
const mockSetNodes = jest.fn();
const mockSetEdges = jest.fn();

// Override the @xyflow/react mock from vitest.utilities for this test
jest.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    fitView: jest.fn(),
    getNodes: mockGetNodes,
    getEdges: mockGetEdges,
    setNodes: mockSetNodes,
    setEdges: mockSetEdges,
  }),
}));

describe('NodeActionsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (providerProps: any = {}) => {
    return ({ children }: { children: React.ReactNode }) => (
      <CelestialNodeActionsProvider {...providerProps}>{children}</CelestialNodeActionsProvider>
    );
  };

  describe('handleDashboardClick', () => {
    it('calls onDashboardClick callback with node props', () => {
      const onDashboardClick = jest.fn();
      const wrapper = createWrapper({ onDashboardClick });
      const { result } = renderHook(() => useCelestialNodeActionsContext(), { wrapper });

      const mockEvent = { stopPropagation: jest.fn(), preventDefault: jest.fn() } as any;
      const nodeProps = { id: 'node-1', title: 'Test Node' } as any;

      act(() => {
        result.current.onDashboardClick?.(mockEvent, nodeProps);
      });

      expect(onDashboardClick).toHaveBeenCalledWith(nodeProps);
    });

    it('calls fitViewWithDelay when onDashboardClick is provided', () => {
      const onDashboardClick = jest.fn();
      const wrapper = createWrapper({ onDashboardClick });
      const { result } = renderHook(() => useCelestialNodeActionsContext(), { wrapper });

      const mockEvent = {} as any;
      const nodeProps = { id: 'node-1' } as any;

      act(() => {
        result.current.onDashboardClick?.(mockEvent, nodeProps);
      });

      expect(mockFitViewWithDelay).toHaveBeenCalled();
    });

    it('does NOT call fitViewWithDelay when onDashboardClick is undefined', () => {
      const wrapper = createWrapper({});
      const { result } = renderHook(() => useCelestialNodeActionsContext(), { wrapper });

      const mockEvent = {} as any;
      const nodeProps = { id: 'node-1' } as any;

      act(() => {
        result.current.onDashboardClick?.(mockEvent, nodeProps);
      });

      expect(mockFitViewWithDelay).not.toHaveBeenCalled();
    });
  });

  describe('onGroupToggle', () => {
    it('calls event.stopPropagation', () => {
      const wrapper = createWrapper({});
      const { result } = renderHook(() => useCelestialNodeActionsContext(), { wrapper });

      const mockEvent = { stopPropagation: jest.fn() } as any;
      const nodeProps = { id: 'group-1', title: 'Group' } as any;

      act(() => {
        result.current.onGroupToggle?.(mockEvent, nodeProps);
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('calls addBreadcrumb with title and props', () => {
      const addBreadcrumb = jest.fn();
      const wrapper = createWrapper({ addBreadcrumb });
      const { result } = renderHook(() => useCelestialNodeActionsContext(), { wrapper });

      const mockEvent = { stopPropagation: jest.fn() } as any;
      const nodeProps = { id: 'group-1', title: 'My Group' } as any;

      act(() => {
        result.current.onGroupToggle?.(mockEvent, nodeProps);
      });

      expect(addBreadcrumb).toHaveBeenCalledWith('My Group', nodeProps);
    });

    it('calls onDataFetch with props', () => {
      const onDataFetch = jest.fn();
      const wrapper = createWrapper({ onDataFetch });
      const { result } = renderHook(() => useCelestialNodeActionsContext(), { wrapper });

      const mockEvent = { stopPropagation: jest.fn() } as any;
      const nodeProps = { id: 'group-1', title: 'Group' } as any;

      act(() => {
        result.current.onGroupToggle?.(mockEvent, nodeProps);
      });

      expect(onDataFetch).toHaveBeenCalledWith(nodeProps);
    });
  });

  describe('useCelestialNodeActionsContext', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useCelestialNodeActionsContext());
      }).toThrow(
        'useCelestialNodeActionsContext must be used within a CelestialNodeActionsProvider'
      );
    });
  });
});
