/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCompressedFieldText, EuiCompressedFormRow, EuiTextColor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback } from 'react';

import { MAX_WORKSPACE_NAME_LENGTH } from '../../../../common/constants';

export interface WorkspaceNameFieldProps {
  value?: string;
  onChange: (newValue: string) => void;
  error?: string;
  readOnly?: boolean;
  placeholder?: string;
  showDescription?: boolean;
}

export const WorkspaceNameField = ({
  value,
  error,
  readOnly,
  onChange,
  placeholder,
  showDescription = true,
}: WorkspaceNameFieldProps) => {
  const handleChange = useCallback(
    (e) => {
      onChange(e.currentTarget.value);
    },
    [onChange]
  );
  const leftCharacters = MAX_WORKSPACE_NAME_LENGTH - (value?.length ?? 0);
  const charactersOverflow = leftCharacters < 0;

  return (
    <EuiCompressedFormRow
      label={i18n.translate('workspace.form.workspaceDetails.name.label', {
        defaultMessage: 'Name',
      })}
      helpText={
        <>
          <EuiTextColor color={charactersOverflow ? 'danger' : 'subdued'}>
            {i18n.translate('workspace.form.name.charactersLeft', {
              defaultMessage: '{leftCharacters} characters left.',
              values: {
                leftCharacters,
              },
            })}
          </EuiTextColor>
          {showDescription && (
            <>
              <br />
              {i18n.translate('workspace.form.workspaceDetails.name.helpTextLong', {
                defaultMessage:
                  'Use a unique name for the workspace. Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
              })}
            </>
          )}
        </>
      }
      isInvalid={!!error || charactersOverflow}
      error={error}
    >
      <EuiCompressedFieldText
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        data-test-subj="workspaceForm-workspaceDetails-nameInputText"
        placeholder={
          placeholder ||
          i18n.translate('workspace.form.workspaceDetails.name.placeholder', {
            defaultMessage: 'Enter a name',
          })
        }
      />
    </EuiCompressedFormRow>
  );
};
