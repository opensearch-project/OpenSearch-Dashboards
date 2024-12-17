/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiColorPicker,
  EuiDescribedFormGroup,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormControlLayout,
  EuiFormRow,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { EuiColorPickerOutput } from '@elastic/eui/src/components/color_picker/color_picker';
import { i18n } from '@osd/i18n';
import {
  WorkspaceDescriptionField,
  WorkspaceNameField,
  WorkspaceFormErrors,
} from '../workspace_form';
import { generateRightSidebarScrollProps, RightSidebarScrollField } from './utils';

interface CreatorDetailsPanelProps {
  color?: string;
  name?: string;
  description?: string;
  formErrors?: Pick<WorkspaceFormErrors, 'name' | 'color'>;
  onColorChange: (text: string, output: EuiColorPickerOutput) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export const CreatorDetailsPanel = ({
  color,
  name,
  description,
  formErrors,
  onColorChange,
  onNameChange,
  onDescriptionChange,
}: CreatorDetailsPanelProps) => {
  return (
    <EuiPanel>
      <EuiText size="s">
        <h2>
          {i18n.translate('workspace.creator.details.panel.title', {
            defaultMessage: 'Workspace details',
          })}
        </h2>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiDescribedFormGroup
        title={
          <h4 {...generateRightSidebarScrollProps(RightSidebarScrollField.Name)}>
            {i18n.translate('workspace.creator.details.panel.fields.name.title', {
              defaultMessage: 'Workspace name',
            })}
          </h4>
        }
        description={i18n.translate('workspace.creator.details.panel.fields.name.description', {
          defaultMessage:
            'Use a unique name for the workspace. Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space). You can also select a color for the workspace icon.',
        })}
      >
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem style={{ maxWidth: 64 }} grow={false}>
            <EuiFormRow
              label={i18n.translate('workspace.creator.details.panel.fields.color.label', {
                defaultMessage: 'Color',
              })}
              {...generateRightSidebarScrollProps(RightSidebarScrollField.Color)}
              error={formErrors?.color?.message}
              isInvalid={!!formErrors?.color}
            >
              <EuiColorPicker
                color={color}
                onChange={onColorChange}
                compressed
                mode="swatch"
                button={
                  <EuiFormControlLayout
                    icon={{
                      type: 'arrowDown',
                      side: 'right',
                    }}
                    style={{ color }}
                    compressed
                  >
                    {/** Add empty value here to keep the same UI with name input. Use read only will render a different background */}
                    <EuiFieldText icon={{ type: 'swatchInput', size: 'm' }} value="" compressed />
                  </EuiFormControlLayout>
                }
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <WorkspaceNameField
              onChange={onNameChange}
              value={name}
              placeholder={i18n.translate(
                'workspace.creator.details.panel.fields.name.placeholder',
                {
                  defaultMessage: 'Enter the name for the workspace',
                }
              )}
              showDescription={false}
              error={formErrors?.name?.message}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiDescribedFormGroup>
      <EuiDescribedFormGroup
        title={
          <h4 {...generateRightSidebarScrollProps(RightSidebarScrollField.Description)}>
            {i18n.translate('workspace.creator.details.panel.fields.description.title', {
              defaultMessage: 'Workspace description',
            })}
          </h4>
        }
      >
        <WorkspaceDescriptionField value={description} onChange={onDescriptionChange} />
      </EuiDescribedFormGroup>
    </EuiPanel>
  );
};
