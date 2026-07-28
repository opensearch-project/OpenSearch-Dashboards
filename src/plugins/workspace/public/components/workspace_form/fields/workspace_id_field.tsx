/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import {
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiIconTip,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
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
    <div>
      <p>
        {i18n.translate('workspace.form.workspaceDetails.id.tooltip.intro', {
          defaultMessage: 'Optional. Must be one of:',
        })}
      </p>
      <ul style={{ paddingLeft: 16, margin: '4px 0 0' }}>
        <li>
          {i18n.translate('workspace.form.workspaceDetails.id.tooltip.uuid', {
            defaultMessage: 'A UUID',
          })}
        </li>
        <li>
          {i18n.translate('workspace.form.workspaceDetails.id.tooltip.short', {
            defaultMessage: '6–20 chars: letters, numbers, _ or -',
          })}
        </li>
      </ul>
    </div>
  );

  const label = (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        {i18n.translate('workspace.form.workspaceDetails.id.label', {
          defaultMessage: 'Workspace ID',
        })}
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiIconTip
          type="questionInCircle"
          color="subdued"
          content={tooltipContent}
          position="right"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <EuiCompressedFormRow label={label} isInvalid={!!error} error={error}>
      <EuiCompressedFieldText
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
