/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiFormRow, EuiFieldNumber, EuiFieldText } from '@elastic/eui';
import { useDebouncedNumericValue, useDebouncedValue } from '../utils/use_debounced_value';

// Component for a single axis title input with debouncing
export const DebouncedTruncateField: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [localValue, handleChange] = useDebouncedNumericValue(value, onChange, {
    delay: 500,
    min: 1,
    defaultValue: 100,
  });

  return (
    <EuiFormRow label={label}>
      <EuiFieldNumber value={localValue} onChange={(e) => handleChange(e.target.value)} />
    </EuiFormRow>
  );
};

// Component for a truncate field with debouncing
export const DebouncedText: React.FC<{
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  label: string;
}> = ({ value, placeholder, onChange, label }) => {
  const [localValue, handleChange] = useDebouncedValue(value, onChange, 500);

  return (
    <EuiFormRow label={label}>
      <EuiFieldText
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </EuiFormRow>
  );
};
