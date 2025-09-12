/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useDebouncedValue, useDebouncedNumber } from './use_debounced_value';

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
});

describe('useDebouncedNumber', () => {
  it('should return the initial value immediately', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() => useDebouncedNumber(10, mockOnChange));
    // The hook returns [value, setter]
    expect(result.current[0]).toBe(10);
  });

  it('should apply min constraint to the value', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() => useDebouncedNumber(5, mockOnChange, { min: 10, max: 100 }));

    // Set a value below the min
    act(() => {
      result.current[1](5);
    });

    // Fast-forward time to trigger the debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should be constrained to min
    expect(mockOnChange).toHaveBeenCalledWith(10);
  });

  it('should apply max constraint to the value', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() =>
      useDebouncedNumber(150, mockOnChange, { min: 10, max: 100 })
    );

    // Set a value above the max
    act(() => {
      result.current[1](150);
    });

    // Fast-forward time to trigger the debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should be constrained to max
    expect(mockOnChange).toHaveBeenCalledWith(100);
  });

  it('should debounce the value changes', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() => useDebouncedNumber(10, mockOnChange, { delay: 500 }));

    // Change the value
    act(() => {
      result.current[1](20);
    });

    // Local value should be updated immediately
    expect(result.current[0]).toBe(20);

    // But onChange should not have been called yet
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time by 300ms (less than the delay)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // onChange should still not have been called
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time by another 200ms (to reach the delay)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // onChange should now have been called
    expect(mockOnChange).toHaveBeenCalledWith(20);
  });

  it('should update the local value when the input value changes', () => {
    const mockOnChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedNumber(value, mockOnChange),
      {
        initialProps: { value: 10 },
      }
    );

    // Initial value should be 10
    expect(result.current[0]).toBe(10);

    // Change the input value
    rerender({ value: 20 });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    // Local value should be updated
    expect(result.current[0]).toBe(20);
  });

  it('should handle undefined values', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() => useDebouncedNumber(undefined, mockOnChange));

    // Initial value should be undefined
    expect(result.current[0]).toBeUndefined();

    // Set a value
    act(() => {
      result.current[1](30);
    });

    // Local value should be updated immediately
    expect(result.current[0]).toBe(30);

    // Fast-forward time to trigger the debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // onChange should have been called with the new value
    expect(mockOnChange).toHaveBeenCalledWith(30);

    // Set value back to undefined
    act(() => {
      result.current[1](undefined);
    });

    // Local value should be updated immediately
    expect(result.current[0]).toBeUndefined();

    // Fast-forward time to trigger the debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // onChange should have been called with undefined
    expect(mockOnChange).toHaveBeenCalledWith(undefined);
  });
});
