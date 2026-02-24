/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useLegendPosition } from './use-legend-position.hook';
describe('useLegendPosition', () => {
  // Create mock values for testing
  const mockRect = {
    top: 50,
    left: 100,
    width: 200,
    height: 50,
    bottom: 100,
    right: 300,
    x: 100,
    y: 50,
    toJSON: () => {},
  };

  // Create a mock trigger element
  let mockTrigger: HTMLButtonElement;

  const originalInnerWidth = window.innerWidth;
  const originalScrollY = window.scrollY;

  beforeEach(() => {
    // Create fresh mock trigger for each test
    mockTrigger = document.createElement('button');
    // Mock getBoundingClientRect method
    mockTrigger.getBoundingClientRect = jest.fn().mockReturnValue(mockRect);

    // Mock window properties using Object.defineProperty (innerWidth and scrollY are value properties in jsdom)
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 10, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(window, 'scrollY', { value: originalScrollY, writable: true });
  });

  // Test cases
  it('should return undefined when legend is closed', () => {
    const { result } = renderHook(() => useLegendPosition(false, mockTrigger));
    expect(result.current).toBeUndefined();
  });

  it('should return undefined when trigger is null', () => {
    const { result } = renderHook(() => useLegendPosition(true, null));
    expect(result.current).toBeUndefined();
  });

  it('should return the correct position when legend is open', async () => {
    const { result } = renderHook(() => useLegendPosition(true, mockTrigger));

    // Wait for the useEffect to run and verify the position is calculated correctly
    await waitFor(() => {
      expect(result.current).toEqual({
        top: 60, // mockRect.top + window.scrollY (50 + 10)
        right: 929, // window.innerWidth - mockRect.left + 5 (1024 - 100 + 5)
      });
    });
  });
});
