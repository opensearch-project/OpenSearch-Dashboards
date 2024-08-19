/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiColorPicker, EuiCompressedFormRow, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiColorPickerOutput } from '@elastic/eui/src/components/color_picker/color_picker';
import { WorkspaceFormErrors } from './types';
import { WorkspaceNameField } from './fields/workspace_name_field';
import { WorkspaceDescriptionField } from './fields/workspace_description_field';

export interface EnterDetailsPanelProps {
  formErrors: WorkspaceFormErrors;
  name?: string;
  description?: string;
  color?: string;
  readOnly: boolean;
  onNameChange: (newValue: string) => void;
  onDescriptionChange: (newValue: string) => void;
  handleColorChange: (text: string, output: EuiColorPickerOutput) => void;
}

export const EnterDetailsPanel = ({
  formErrors,
  name,
  description,
  color,
  readOnly,
  onNameChange,
  onDescriptionChange,
  handleColorChange,
}: EnterDetailsPanelProps) => {
  return (
    <>
      <WorkspaceNameField
        value={name}
        onChange={onNameChange}
        readOnly={readOnly}
        error={formErrors.name?.message}
      />
      <WorkspaceDescriptionField
        value={description}
        onChange={onDescriptionChange}
        readOnly={readOnly}
        error={formErrors.name?.message}
      />
      <EuiCompressedFormRow
        label={i18n.translate('workspace.form.workspaceDetails.color.label', {
          defaultMessage: 'Workspace icon color',
        })}
        isInvalid={!!formErrors.color}
        error={formErrors.color?.message}
      >
        <div>
          <EuiText size="xs" color="subdued">
            {i18n.translate('workspace.form.workspaceDetails.color.description', {
              defaultMessage: 'Select a background color for the icon representing this workspace.',
            })}
          </EuiText>
          <EuiSpacer size={'s'} />
          <EuiColorPicker
            color={color}
            onChange={handleColorChange}
            data-test-subj="workspaceForm-workspaceDetails-colorPicker"
          />
        </div>
      </EuiCompressedFormRow>
    </>
  );
};
