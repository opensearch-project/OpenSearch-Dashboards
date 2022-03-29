/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFormRow, EuiFieldText } from '@elastic/eui';
import { InputContribution } from './types';

interface InputProps extends Omit<InputContribution, 'type'> {
  value: string;
}

export const TextInput = ({ label, onChange, value, ...rest }: InputProps) => {
  // const { isInvalid, errorMessage } = getFieldValidityAndErrorMessage(field);

  return (
    <EuiFormRow
      label={label}
      // error={errorMessage}
      // isInvalid={isInvalid}
      fullWidth
      data-test-subj={rest['data-test-subj']}
      describedByIds={rest.idAria ? [rest.idAria] : undefined}
    >
      <EuiFieldText
        fullWidth
        onChange={(event) => {
          onChange?.(event.target.value);
        }}
        // isInvalid={isInvalid}
        value={value || ''}
        data-test-subj="text_input"
      />
    </EuiFormRow>
  );
};
