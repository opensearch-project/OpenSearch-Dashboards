/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCompressedFormRow, EuiCompressedTextArea, EuiTextColor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback } from 'react';

import { MAX_WORKSPACE_DESCRIPTION_LENGTH } from '../../../../common/constants';

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
      onChange(e.currentTarget.value);
    },
    [onChange]
  );
  const leftCharacters = MAX_WORKSPACE_DESCRIPTION_LENGTH - (value?.length ?? 0);
  const charactersOverflow = leftCharacters < 0;

  return (
    <EuiCompressedFormRow
      label={
        <>
          Description - <i>optional</i>
        </>
      }
      isInvalid={!!error || charactersOverflow}
      error={error}
      helpText={
        <EuiTextColor color={charactersOverflow ? 'danger' : 'subdued'}>
          {i18n.translate('workspace.form.description.charactersLeft', {
            defaultMessage: '{leftCharacters} characters left.',
            values: {
              leftCharacters,
            },
          })}
        </EuiTextColor>
      }
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
      />
    </EuiCompressedFormRow>
  );
};
