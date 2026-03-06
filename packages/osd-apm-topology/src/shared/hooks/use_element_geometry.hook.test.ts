/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useElementGeometry } from './use_element_geometry.hook';
describe('useElementGeometry', () => {
  test('should initialize with null rect', () => {
    const { result } = renderHook(() => useElementGeometry<HTMLDivElement>(true));
    // Check that rect is null initially
    expect(result.current.rect).toBe(null);
    // Verify elRef is a ref object
    expect(result.current.elRef).toHaveProperty('current');
    expect(result.current.elRef.current).toBe(null);
  });

  test('should maintain ref identity between renders', () => {
    const { result, rerender } = renderHook(() => useElementGeometry<HTMLDivElement>(true));

    // Get the initial ref object
    const initialRef = result.current.elRef;

    // Rerender the hook
    rerender();

    // Verify the ref object is the same instance (stable between renders)
    expect(result.current.elRef).toBe(initialRef);
  });

  test('should update rect when shouldRefresh changes to true', () => {
    // Start with shouldRefresh as false
    const { result, rerender } = renderHook(
      ({ shouldRefresh }) => useElementGeometry<HTMLDivElement>(shouldRefresh),
      { initialProps: { shouldRefresh: false } }
    );

    // Create a mock element and attach it to the ref
    const mockElement = document.createElement('div');
    const mockRect = { width: 100, height: 100 } as DOMRect;
    mockElement.getBoundingClientRect = jest.fn().mockReturnValue(mockRect);

    // Manually set the ref's current value
    act(() => {
      result.current.elRef.current = mockElement as HTMLDivElement;
    });

    // Rect should still be null because shouldRefresh is false
    expect(result.current.rect).toBe(null);

    // Now change shouldRefresh to true
    rerender({ shouldRefresh: true });

    // Rect should be updated
    expect(result.current.rect).toBe(mockRect);
    expect(mockElement.getBoundingClientRect).toHaveBeenCalledTimes(1);
  });

  test('should not update rect when shouldRefresh remains false', () => {
    // Start with shouldRefresh as false
    const { result, rerender } = renderHook(
      ({ shouldRefresh }) => useElementGeometry<HTMLDivElement>(shouldRefresh),
      { initialProps: { shouldRefresh: false } }
    );

    // Create a mock element and attach it to the ref
    const mockElement = document.createElement('div');
    const mockRect = { width: 100, height: 100 } as DOMRect;
    mockElement.getBoundingClientRect = jest.fn().mockReturnValue(mockRect);

    // Manually set the ref's current value
    act(() => {
      result.current.elRef.current = mockElement as HTMLDivElement;
    });

    // Rerender with shouldRefresh still false
    rerender({ shouldRefresh: false });

    // Rect should still be null
    expect(result.current.rect).toBe(null);
    expect(mockElement.getBoundingClientRect).not.toHaveBeenCalled();
  });
});
