/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing values
 * @param value The value to debounce
 * @param onChange The callback to call with the debounced value
 * @param delay The debounce delay in milliseconds
 * @returns [localValue, setLocalValue] - The local value and setter for immediate UI updates
 */
export function useDebouncedValue<T>(
  value: T,
  onChange: (value: T) => void,
  delay: number = 500
): [T, (value: T) => void] {
  const [localValue, setLocalValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (newValue: T) => {
    // Update local value immediately
    setLocalValue(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      timeoutRef.current = null;
    }, delay);
  };

  return [localValue, handleChange];
}

/**
 * Custom hook for debouncing numeric input values
 * Includes validation for min/max bounds
 */
export function useDebouncedNumericValue(
  value: number,
  onChange: (value: number) => void,
  options: {
    delay?: number;
    min?: number;
    max?: number;
    defaultValue?: number;
  } = {}
): [number, (value: string | number) => void] {
  const { delay = 500, min, max, defaultValue = 0 } = options;

  const [localValue, setDebouncedValue] = useDebouncedValue(value, onChange, delay);

  const handleNumericChange = (newValue: string | number) => {
    let numValue: number;

    if (typeof newValue === 'string') {
      numValue = parseFloat(newValue);
      if (isNaN(numValue)) {
        numValue = defaultValue;
      }
    } else {
      numValue = newValue;
    }

    // Apply min/max bounds
    if (min !== undefined && numValue < min) {
      numValue = min;
    }
    if (max !== undefined && numValue > max) {
      numValue = max;
    }

    setDebouncedValue(numValue);
  };

  return [localValue, handleNumericChange];
}
