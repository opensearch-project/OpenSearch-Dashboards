/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCompressedFormRow, EuiCompressedTextArea } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback } from 'react';

import { MAX_DESCRIPTION_LENGTH } from '../constants';

export interface WorkspaceDescriptionFieldProps {
  value?: string;
  onChange: (newValue: string) => void;
  error?: string;
  readOnly?: boolean;
}

export const WorkspaceDescriptionField = ({
  value,
  error,
  readOnly,
  onChange,
}: WorkspaceDescriptionFieldProps) => {
  const handleChange = useCallback(
    (e) => {
      const newValue = e.currentTarget.value;
      if (newValue.length <= MAX_DESCRIPTION_LENGTH) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <EuiCompressedFormRow
      label={
        <>
          Description - <i>optional</i>
        </>
      }
      isInvalid={!!error}
      error={error}
      helpText={<>{MAX_DESCRIPTION_LENGTH - (value?.length ?? 0)} characters left.</>}
    >
      <EuiCompressedTextArea
        value={value}
        onChange={handleChange}
        data-test-subj="workspaceForm-workspaceDetails-descriptionInputText"
        rows={4}
        placeholder={i18n.translate('workspace.form.workspaceDetails.description.placeholder', {
          defaultMessage: 'Describe the workspace',
        })}
        readOnly={readOnly}
        maxLength={MAX_DESCRIPTION_LENGTH}
      />
    </EuiCompressedFormRow>
  );
};
