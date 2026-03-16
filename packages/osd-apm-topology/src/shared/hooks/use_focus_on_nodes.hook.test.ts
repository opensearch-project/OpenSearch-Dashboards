/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { mockUseReactFlow } from '../../test_utils/jest.setup';
import { useFocusOnNodes } from './use_focus_on_nodes.hook';
import type { CelestialNode } from '../../types';

const createNode = (
  id: string,
  x: number,
  y: number,
  overrides: Record<string, any> = {}
): CelestialNode => ({
  id,
  type: 'celestialNode',
  position: { x, y },
  data: { id, title: id, keyAttributes: {} } as any,
  ...overrides,
});

describe('useFocusOnNodes', () => {
  const mockFitBounds = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockFitBounds.mockClear();
    mockUseReactFlow.mockReturnValue({ fitView: jest.fn(), fitBounds: mockFitBounds });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns early when nodesInFocus is empty', () => {
    const { result } = renderHook(() => useFocusOnNodes());

    act(() => {
      result.current.focusOnNodes([], [], 100);
      jest.advanceTimersByTime(200);
    });

    expect(mockFitBounds).not.toHaveBeenCalled();
  });

  it('returns early when nodesInFocus is undefined-like', () => {
    const { result } = renderHook(() => useFocusOnNodes());

    act(() => {
      result.current.focusOnNodes(null as any, [], 100);
      jest.advanceTimersByTime(200);
    });

    expect(mockFitBounds).not.toHaveBeenCalled();
  });

  it('calls fitBounds with bounding box of focused nodes after delay', () => {
    const nodes = [createNode('a', 0, 0), createNode('b', 300, 200)];

    const { result } = renderHook(() => useFocusOnNodes());

    act(() => {
      result.current.focusOnNodes(nodes, nodes, 100);
    });

    expect(mockFitBounds).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      }),
      { padding: 0.1, duration: 400 }
    );
  });

  it('uses default delay of 100ms', () => {
    const nodes = [createNode('a', 0, 0)];
    const { result } = renderHook(() => useFocusOnNodes());

    act(() => {
      result.current.focusOnNodes(nodes, nodes);
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(mockFitBounds).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
  });

  it('calculates padding based on number of focus nodes', () => {
    const nodes = [
      createNode('a', 0, 0),
      createNode('b', 100, 100),
      createNode('c', 200, 200),
      createNode('d', 300, 300),
      createNode('e', 400, 400),
    ];

    const { result } = renderHook(() => useFocusOnNodes());

    act(() => {
      result.current.focusOnNodes(nodes, nodes, 100);
      jest.advanceTimersByTime(100);
    });

    // padding = (5 / 5) * 50 = 50
    const call = mockFitBounds.mock.calls[0][0];
    // The bounding box x should be minX - padding = 0 - 50 = -50
    expect(call.x).toBe(-50);
    expect(call.y).toBe(-50);
  });
});
