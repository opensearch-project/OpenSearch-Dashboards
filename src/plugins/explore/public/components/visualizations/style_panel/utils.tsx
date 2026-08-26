/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback } from 'react';
import {
  EuiFieldNumber,
  EuiFieldText,
  EuiFieldTextProps,
  EuiFieldNumberProps,
  EuiRange,
  EuiRangeProps,
} from '@elastic/eui';
import { useDebouncedNumber, useDebouncedValue } from '../utils/use_debounced_value';

type DebouncedFieldTextProps = Omit<EuiFieldTextProps, 'onChange' | 'value'> & {
  onChange: (val: string) => void;
  value: string;
};

export const DebouncedFieldText = ({
  value,
  onChange,
  compressed = true,
  ...props
}: DebouncedFieldTextProps) => {
  const [localValue, handleChange] = useDebouncedValue(value, onChange, 500);

  return (
    <EuiFieldText
      compressed={compressed}
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      {...props}
    />
  );
};

type DebouncedFieldNumberProps = Omit<
  EuiFieldNumberProps,
  'onChange' | 'value' | 'defaultValue'
> & {
  onChange: (val: number | undefined) => void;
  value: number | undefined;
  defaultValue?: number;
};

export const DebouncedFieldNumber = ({
  value,
  onChange,
  compressed = true,
  min,
  max,
  defaultValue,
  ...props
}: DebouncedFieldNumberProps) => {
  const [localValue, onLocalValueChange] = useDebouncedNumber(value, onChange, { min, max });

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === '') {
        onLocalValueChange(defaultValue);
      } else {
        onLocalValueChange(Number(e.target.value));
      }
    },
    [onLocalValueChange, defaultValue]
  );

  return (
    <EuiFieldNumber
      value={localValue ?? ''}
      compressed={compressed}
      onChange={onInputChange}
      {...props}
    />
  );
};

type DebouncedFieldRangeProps = Omit<EuiRangeProps, 'onChange' | 'value'> & {
  onChange: (val: number | undefined) => void;
  value: number | undefined;
  defaultValue?: number;
  min: number;
  max: number;
};

export const DebouncedFieldRange = ({
  value,
  onChange,
  compressed = true,
  min,
  max,
  defaultValue = min,
  ...props
}: DebouncedFieldRangeProps) => {
  const [localValue, onLocalValueChange] = useDebouncedNumber(value, onChange, { min, max });

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
      const nextValue = e.currentTarget.value;
      onLocalValueChange(nextValue === '' ? defaultValue : Number(nextValue));
    },
    [onLocalValueChange, defaultValue]
  );

  return (
    <EuiRange
      value={localValue ?? defaultValue}
      compressed={compressed}
      min={min}
      max={max}
      onChange={onInputChange}
      showValue
      {...props}
    />
  );
};
