/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiColorPicker,
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiSpacer,
  EuiText,
  EuiCompressedTextArea,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiColorPickerOutput } from '@elastic/eui/src/components/color_picker/color_picker';
import { WorkspaceFormErrors } from './types';

export interface EnterDetailsPanelProps {
  formErrors: WorkspaceFormErrors;
  name?: string;
  description?: string;
  color?: string;
  readOnly: boolean;
  handleNameInputChange: React.ChangeEventHandler<HTMLInputElement>;
  handleDescriptionChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleColorChange: (text: string, output: EuiColorPickerOutput) => void;
}

export const EnterDetailsPanel = ({
  formErrors,
  name,
  description,
  color,
  readOnly,
  handleNameInputChange,
  handleDescriptionChange,
  handleColorChange,
}: EnterDetailsPanelProps) => {
  return (
    <>
      <EuiCompressedFormRow
        label={i18n.translate('workspace.form.workspaceDetails.name.label', {
          defaultMessage: 'Name',
        })}
        helpText={i18n.translate('workspace.form.workspaceDetails.name.helpText', {
          defaultMessage:
            'Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
        })}
        isInvalid={!!formErrors.name}
        error={formErrors.name?.message}
      >
        <EuiCompressedFieldText
          value={name}
          onChange={handleNameInputChange}
          readOnly={readOnly}
          data-test-subj="workspaceForm-workspaceDetails-nameInputText"
          placeholder={i18n.translate('workspace.form.workspaceDetails.name.placeholder', {
            defaultMessage: 'Enter a name',
          })}
        />
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label={
          <>
            Description - <i>optional</i>
          </>
        }
      >
        <>
          <EuiText size="xs" color="subdued">
            {i18n.translate('workspace.form.workspaceDetails.description.introduction', {
              defaultMessage:
                'Help others understand the purpose of this workspace by providing an overview of the workspace you’re creating.',
            })}
          </EuiText>
          <EuiCompressedTextArea
            value={description}
            onChange={handleDescriptionChange}
            data-test-subj="workspaceForm-workspaceDetails-descriptionInputText"
            rows={4}
            placeholder={i18n.translate('workspace.form.workspaceDetails.description.placeholder', {
              defaultMessage: 'Describe the workspace',
            })}
          />
        </>
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label={i18n.translate('workspace.form.workspaceDetails.color.label', {
          defaultMessage: 'Color',
        })}
        isInvalid={!!formErrors.color}
        error={formErrors.color?.message}
      >
        <div>
          <EuiText size="xs" color="subdued">
            {i18n.translate('workspace.form.workspaceDetails.color.helpText', {
              defaultMessage: 'Accent color for your workspace',
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
