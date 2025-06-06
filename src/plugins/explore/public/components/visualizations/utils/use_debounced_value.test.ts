/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useDebouncedValue, useDebouncedNumericValue } from './use_debounced_value';

// Mock timer functions
jest.useFakeTimers();

describe('useDebouncedValue', () => {
  it('should return the initial value immediately', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() => useDebouncedValue('initial', mockOnChange, 500));
    expect(result.current).toBe('initial');
  });

  it('should not update the value before the delay has elapsed', () => {
    const mockOnChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, mockOnChange, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be the initial value
    expect(result.current).toBe('initial');

    // Fast-forward time by 300ms (less than the delay)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Value should still be the initial value
    expect(result.current).toBe('initial');
  });

  it('should update the value after the delay has elapsed', () => {
    const mockOnChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, mockOnChange, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Fast-forward time by 500ms (equal to the delay)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should handle multiple value changes within the delay period', () => {
    const mockOnChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, mockOnChange, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change the value multiple times
    rerender({ value: 'update1', delay: 500 });

    // Fast-forward time by 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Change the value again
    rerender({ value: 'update2', delay: 500 });

    // Fast-forward time by 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Change the value one more time
    rerender({ value: 'final', delay: 500 });

    // Value should still be the initial value
    expect(result.current).toBe('initial');

    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should now be the final update
    expect(result.current).toBe('final');
  });

  it('should handle delay changes', () => {
    const mockOnChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, mockOnChange, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change the value and delay
    rerender({ value: 'updated', delay: 1000 });

    // Fast-forward time by 500ms (equal to the original delay)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should still be the initial value because we increased the delay
    expect(result.current).toBe('initial');

    // Fast-forward time by another 500ms (total 1000ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should handle different value types', () => {
    // Test with a number
    const numberMockOnChange = jest.fn();
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, numberMockOnChange, delay),
      { initialProps: { value: 42, delay: 500 } }
    );

    // Change the value
    numberRerender({ value: 100, delay: 500 });

    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(numberResult.current[0]).toBe(100);
    expect(numberMockOnChange).toHaveBeenCalledWith(100);

    // Test with an object
    const objectMockOnChange = jest.fn();
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, objectMockOnChange, delay),
      { initialProps: { value: { name: 'initial' }, delay: 500 } }
    );

    // Change the value
    objectRerender({ value: { name: 'updated' }, delay: 500 });

    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(objectResult.current[0]).toEqual({ name: 'updated' });
    expect(objectMockOnChange).toHaveBeenCalledWith({ name: 'updated' });
  });

  describe('useDebouncedNumericValue', () => {
    it('should handle numeric input correctly', () => {
      const mockOnChange = jest.fn();
      const { result } = renderHook(() =>
        useDebouncedNumericValue(10, mockOnChange, { min: 0, max: 100 })
      );

      // Get the setter function
      const setValue = result.current[1];

      // Set a new value as a string
      act(() => {
        setValue('50');
      });

      // Value should be updated locally immediately
      expect(result.current[0]).toBe(50);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // onChange should be called with the parsed number
      expect(mockOnChange).toHaveBeenCalledWith(50);
    });

    it('should respect min and max bounds', () => {
      const mockOnChange = jest.fn();
      const { result } = renderHook(() =>
        useDebouncedNumericValue(10, mockOnChange, { min: 5, max: 20 })
      );

      const setValue = result.current[1];

      // Try to set a value below the minimum
      act(() => {
        setValue(2);
      });

      // Value should be clamped to the minimum
      expect(result.current[0]).toBe(5);

      // Try to set a value above the maximum
      act(() => {
        setValue(30);
      });

      // Value should be clamped to the maximum
      expect(result.current[0]).toBe(20);
    });

    it('should handle invalid string inputs', () => {
      const mockOnChange = jest.fn();
      const { result } = renderHook(() =>
        useDebouncedNumericValue(10, mockOnChange, { defaultValue: 5 })
      );

      const setValue = result.current[1];

      // Set an invalid string value
      act(() => {
        setValue('not-a-number');
      });

      // Value should be set to the default value
      expect(result.current[0]).toBe(5);
    });
  });
});
