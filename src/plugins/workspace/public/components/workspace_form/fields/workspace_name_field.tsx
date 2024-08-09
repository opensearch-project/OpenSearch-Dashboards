/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCompressedFieldText, EuiCompressedFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback } from 'react';

import { MAX_WORKSPACE_NAME_LENGTH } from '../../../../common/constants';

export interface WorkspaceNameFieldProps {
  value?: string;
  onChange: (newValue: string) => void;
  error?: string;
  readOnly?: boolean;
}

export const WorkspaceNameField = ({
  value,
  error,
  readOnly,
  onChange,
}: WorkspaceNameFieldProps) => {
  const handleChange = useCallback(
    (e) => {
      const newValue = e.currentTarget.value;
      if (newValue.length <= MAX_WORKSPACE_NAME_LENGTH) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <EuiCompressedFormRow
      label={i18n.translate('workspace.form.workspaceDetails.name.label', {
        defaultMessage: 'Name',
      })}
      helpText={
        <>
          {MAX_WORKSPACE_NAME_LENGTH - (value?.length ?? 0)} characters left. <br />
          {i18n.translate('workspace.form.workspaceDetails.name.helpText', {
            defaultMessage:
              'Use a unique name for the workspace. Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
          })}
        </>
      }
      isInvalid={!!error}
      error={error}
    >
      <EuiCompressedFieldText
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        data-test-subj="workspaceForm-workspaceDetails-nameInputText"
        placeholder={i18n.translate('workspace.form.workspaceDetails.name.placeholder', {
          defaultMessage: 'Enter a name',
        })}
        maxLength={MAX_WORKSPACE_NAME_LENGTH}
      />
    </EuiCompressedFormRow>
  );
};
