/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect } from 'react';
import { useDebounce } from 'react-use';

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

  // Update local value when input value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useDebounce(
    () => {
      onChange(localValue);
    },
    delay,
    [localValue]
  );

  return [localValue, setLocalValue];
}

export const useDebouncedNumber = (
  value: number | undefined,
  onChange: (val: number | undefined) => void,
  options: { delay?: number; min?: number; max?: number } = {}
) => {
  const { min, max, delay } = options;
  const [localValue, setLocalValue] = useState(value);

  const onDebouncedValueChange = useCallback(
    (num: number | undefined) => {
      let finalValue = num;
      if (typeof num === 'number' && typeof max === 'number' && num > max) {
        finalValue = max;
      }
      if (typeof num === 'number' && typeof min === 'number' && num < min) {
        finalValue = min;
      }
      setLocalValue(finalValue);
      onChange(finalValue);
    },
    [min, max, onChange]
  );

  const [, onValueChange] = useDebouncedValue<number | undefined>(
    value,
    onDebouncedValueChange,
    delay
  );

  const onLocalChange = useCallback(
    (val: number | undefined) => {
      setLocalValue(val);
      onValueChange(val);
    },
    [onValueChange]
  );

  return [localValue, onLocalChange] as const;
};
