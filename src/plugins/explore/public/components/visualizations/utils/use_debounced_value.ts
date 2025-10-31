/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDebounce, useEffectOnce } from 'react-use';

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
  const initialValueRef = useRef(value);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (initialValueRef.current !== localValue) {
      isDirtyRef.current = true;
    }
  }, [localValue]);

  // Update local value when input value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useDebounce(
    () => {
      // Skip onChange call for the initial value
      if (isDirtyRef.current) {
        onChange(localValue);
      }
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

  // Apply constraints to a value
  const getConstrainedValue = useCallback(
    (num: number | undefined) => {
      let finalValue = num;
      if (typeof num === 'number' && typeof max === 'number' && num > max) {
        finalValue = max;
      }
      if (typeof num === 'number' && typeof min === 'number' && num < min) {
        finalValue = min;
      }
      return finalValue;
    },
    [min, max]
  );

  // Apply constraints to initial value
  const constrainedInitialValue = getConstrainedValue(value);
  const [localValue, setLocalValue] = useState(constrainedInitialValue);

  // Call onChange immediately if initial value was constrained
  useEffectOnce(() => {
    if (constrainedInitialValue !== value) {
      onChange(constrainedInitialValue);
    }
  });

  const onDebouncedValueChange = useCallback(
    (num: number | undefined) => {
      const finalValue = getConstrainedValue(num);
      setLocalValue(finalValue);
      onChange(finalValue);
    },
    [getConstrainedValue, onChange]
  );

  const [, onValueChange] = useDebouncedValue<number | undefined>(
    constrainedInitialValue,
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
