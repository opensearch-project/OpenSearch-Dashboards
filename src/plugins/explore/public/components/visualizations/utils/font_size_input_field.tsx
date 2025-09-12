/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFieldText, EuiFormRow } from '@elastic/eui';
import React from 'react';
import { useDebouncedValue } from './use_debounced_value';

interface Props {
  value: number | undefined;
  onChange: (val?: number) => void;
  label?: string;
  'data-test-subj'?: string;
}

export const FontSizeInputField = (props: Props) => {
  const [fontSize, handleFontSize] = useDebouncedValue(props.value, (val) => {
    if (val !== undefined && val > 0) {
      props.onChange(val);
    } else {
      props.onChange(undefined);
    }
  });

  return (
    <EuiFormRow label={props.label}>
      <EuiFieldText
        placeholder="Auto"
        type="number"
        compressed
        value={fontSize === undefined ? '' : fontSize}
        onChange={(e) => handleFontSize(Number(e.target.value))}
        data-test-subj={props['data-test-subj']}
      />
    </EuiFormRow>
  );
};
