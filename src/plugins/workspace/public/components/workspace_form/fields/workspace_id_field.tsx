/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiCompressedFieldText, EuiCompressedFormRow, EuiIconTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface WorkspaceIdFieldProps {
  value?: string;
  onChange: (newValue: string) => void;
  error?: string;
}

export const WorkspaceIdField = ({ value, error, onChange }: WorkspaceIdFieldProps) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.currentTarget.value);
    },
    [onChange]
  );

  const tooltipContent = (
    <p>
      {i18n.translate('workspace.form.workspaceDetails.id.tooltip', {
        defaultMessage: 'Optional. Use 6–36 letters, numbers, underscores, or hyphens.',
      })}
    </p>
  );

  const label = i18n.translate('workspace.form.workspaceDetails.id.label', {
    defaultMessage: 'Workspace ID',
  });

  return (
    <EuiCompressedFormRow
      label={label}
      labelAppend={
        <EuiIconTip
          type="questionInCircle"
          color="subdued"
          content={tooltipContent}
          position="right"
        />
      }
      isInvalid={!!error}
      error={error}
    >
      <EuiCompressedFieldText
        aria-label={label}
        value={value ?? ''}
        onChange={handleChange}
        isInvalid={!!error}
        data-test-subj="workspaceForm-workspaceDetails-idInputText"
        placeholder={i18n.translate('workspace.form.workspaceDetails.id.placeholder', {
          defaultMessage: 'Auto-generated if left blank',
        })}
      />
    </EuiCompressedFormRow>
  );
};
