/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiFormRow, EuiFieldNumber, EuiFieldText, EuiText } from '@elastic/eui';
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
      <EuiFieldNumber
        compressed
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        append={<EuiText size="s">PX</EuiText>}
      />
    </EuiFormRow>
  );
};

export const DebouncedTruncateGaugeBaseField: React.FC<{
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  label: string;
  testId: string;
}> = ({ value, onChange, label, testId }) => {
  const [localValue, handleChange] = useDebouncedValue(value, onChange);

  return (
    <EuiFormRow label={label} helpText="Leave empty to calculate based on all values">
      <EuiFieldNumber
        compressed
        min={0}
        value={localValue}
        onChange={(e) => handleChange(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder="auto"
        data-test-subj={testId}
      />
    </EuiFormRow>
  );
};

// Component for a truncate field with debouncing
export const DebouncedText: React.FC<{
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  label?: string;
  disable?: boolean;
}> = ({ value, placeholder, onChange, label, disable = false }) => {
  const [localValue, handleChange] = useDebouncedValue(value, onChange, 500);

  return (
    <EuiFormRow label={label}>
      <EuiFieldText
        compressed={true}
        disabled={disable}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </EuiFormRow>
  );
};
