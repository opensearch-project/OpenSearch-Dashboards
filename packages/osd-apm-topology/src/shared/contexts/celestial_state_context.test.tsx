/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CelestialStateProvider, useCelestialStateContext } from './celestial_state_context';

describe('CelestialStateContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CelestialStateProvider>{children}</CelestialStateProvider>
  );

  it('provides default state values', () => {
    const { result } = renderHook(() => useCelestialStateContext(), { wrapper });
    expect(result.current.selectedNodeId).toBeUndefined();
    expect(result.current.unstackedAggregateNodeIds).toEqual([]);
    expect(result.current.activeMenuNodeId).toBeNull();
  });

  it('updates selectedNodeId via setSelectedNodeId', () => {
    const { result } = renderHook(() => useCelestialStateContext(), { wrapper });
    act(() => {
      result.current.setSelectedNodeId('node-1');
    });
    expect(result.current.selectedNodeId).toBe('node-1');
  });

  it('updates unstackedAggregateNodeIds via setter', () => {
    const { result } = renderHook(() => useCelestialStateContext(), { wrapper });
    act(() => {
      result.current.setUnstackedAggregateNodeIds(['agg-1', 'agg-2']);
    });
    expect(result.current.unstackedAggregateNodeIds).toEqual(['agg-1', 'agg-2']);
  });

  it('updates activeMenuNodeId via setActiveMenuNodeId', () => {
    const { result } = renderHook(() => useCelestialStateContext(), { wrapper });
    act(() => {
      result.current.setActiveMenuNodeId('menu-1');
    });
    expect(result.current.activeMenuNodeId).toBe('menu-1');
  });

  it('accepts mocks prop to override all state values', () => {
    const mockState = {
      selectedNodeId: 'mock-node',
      setSelectedNodeId: jest.fn(),
      unstackedAggregateNodeIds: ['mock-agg'],
      setUnstackedAggregateNodeIds: jest.fn(),
      activeMenuNodeId: 'mock-menu',
      setActiveMenuNodeId: jest.fn(),
      viewLock: { lock: jest.fn(), isLocked: jest.fn().mockReturnValue(false) },
    };
    const mockWrapper = ({ children }: { children: React.ReactNode }) => (
      <CelestialStateProvider mocks={mockState}>{children}</CelestialStateProvider>
    );
    const { result } = renderHook(() => useCelestialStateContext(), { wrapper: mockWrapper });
    expect(result.current.selectedNodeId).toBe('mock-node');
    expect(result.current.unstackedAggregateNodeIds).toEqual(['mock-agg']);
    expect(result.current.activeMenuNodeId).toBe('mock-menu');
  });

  it('throws when useCelestialStateContext is used outside provider', () => {
    expect(() => {
      renderHook(() => useCelestialStateContext());
    }).toThrow('useCelestialStateContext must be used within a CelestialStateProvider');
  });
});
