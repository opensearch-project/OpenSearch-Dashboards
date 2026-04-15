/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useReactFlow } from '@xyflow/react';
import { useCelestialControls } from './use_celestial_controls.hook';
// Mock the useReactFlow hook
jest.mock('@xyflow/react', () => ({
  useReactFlow: jest.fn(),
}));

describe('useCelestialControls', () => {
  const mockZoomIn = jest.fn();
  const mockZoomOut = jest.fn();
  const mockFitView = jest.fn();

  const createMockEvent = () =>
    (({
      stopPropagation: jest.fn(),
    } as unknown) as React.MouseEvent);

  beforeEach(() => {
    jest.clearAllMocks();
    (useReactFlow as any).mockReturnValue({
      zoomIn: mockZoomIn,
      zoomOut: mockZoomOut,
      fitView: mockFitView,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the correct interface', () => {
    const { result } = renderHook(() => useCelestialControls());

    expect(result.current).toEqual({
      onZoomIn: expect.any(Function),
      onZoomOut: expect.any(Function),
      onFitView: expect.any(Function),
    });
  });

  it('should handle zoom in functionality', () => {
    const { result } = renderHook(() => useCelestialControls());
    const mockEvent = createMockEvent();

    result.current.onZoomIn(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockZoomIn).toHaveBeenCalledWith({ duration: 300 });
  });

  it('should handle zoom out functionality', () => {
    const { result } = renderHook(() => useCelestialControls());
    const mockEvent = createMockEvent();

    result.current.onZoomOut(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockZoomOut).toHaveBeenCalledWith({ duration: 300 });
  });

  it('should handle fit view functionality', () => {
    const { result } = renderHook(() => useCelestialControls());
    const mockEvent = createMockEvent();

    result.current.onFitView(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockFitView).toHaveBeenCalledWith({ duration: 300 });
  });
});
