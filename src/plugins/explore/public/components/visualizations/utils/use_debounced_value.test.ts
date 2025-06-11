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
    // The hook returns [value, setter]
    expect(result.current[0]).toBe('initial');
  });

  it('should not call onChange before the delay has elapsed', () => {
    const mockOnChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, mockOnChange, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Local value should be updated immediately due to the useEffect
    expect(result.current[0]).toBe('updated');

    // But onChange should not have been called yet
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time by 300ms (less than the delay)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // onChange should still not have been called
    expect(mockOnChange).not.toHaveBeenCalled();
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
    expect(result.current[0]).toBe('updated');
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
