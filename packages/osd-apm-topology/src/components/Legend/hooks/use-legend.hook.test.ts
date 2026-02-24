/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useLegend } from './use-legend.hook';
import { useLegendPosition } from './use-legend-position.hook';
// Mock the useLegendPosition hook
jest.mock('./use-legend-position.hook', () => ({
  useLegendPosition: jest.fn().mockReturnValue({ top: 100, right: 200 }),
}));

describe('useLegend', () => {
  const mockStopPropagation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLegend());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBe(null);
    expect(result.current.position).toEqual({ top: 100, right: 200 });
  });

  it('should toggle isOpen state when onToggle is called', () => {
    const { result } = renderHook(() => useLegend());

    act(() => {
      result.current.onToggle(({
        stopPropagation: mockStopPropagation,
      } as unknown) as React.MouseEvent);
    });

    expect(mockStopPropagation).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onToggle(({
        stopPropagation: mockStopPropagation,
      } as unknown) as React.MouseEvent);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should close legend when onClose is called', () => {
    const { result } = renderHook(() => useLegend());

    act(() => {
      result.current.onToggle(({
        stopPropagation: mockStopPropagation,
      } as unknown) as React.MouseEvent);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should calculate position using useLegendPosition', () => {
    const mockedUseLegendPosition = (useLegendPosition as unknown) as ReturnType<typeof jest.fn>;
    const { result } = renderHook(() => useLegend());
    expect(mockedUseLegendPosition).toHaveBeenCalledWith(false, null);

    act(() => {
      result.current.onToggle(({
        stopPropagation: mockStopPropagation,
      } as unknown) as React.MouseEvent);
    });
    expect(mockedUseLegendPosition).toHaveBeenCalledWith(true, null);
  });
});
