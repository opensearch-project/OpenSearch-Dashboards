/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiText,
  EuiColorPicker,
  EuiTextArea,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { WorkspaceBottomBar } from './workspace_bottom_bar';
import { WorkspaceFormProps } from './types';
import { useWorkspaceForm } from './use_workspace_form';
import { WorkspacePermissionSettingPanel } from './workspace_permission_setting_panel';
import { WorkspaceUseCase } from './workspace_use_case';
import { SelectDataSourcePanel } from './select_data_source_panel';

export const WorkspaceForm = (props: WorkspaceFormProps) => {
  const {
    application,
    savedObjects,
    defaultValues,
    operationType,
    permissionEnabled,
    availableUseCases,
    permissionLastAdminItemDeletable,
  } = props;
  const {
    formId,
    formData,
    formErrors,
    numberOfErrors,
    handleFormSubmit,
    handleColorChange,
    handleUseCasesChange,
    handleNameInputChange,
    setPermissionSettings,
    setSelectedDataSources,
    handleDescriptionChange,
  } = useWorkspaceForm(props);
  const workspaceDetailsTitle = i18n.translate('workspace.form.workspaceDetails.title', {
    defaultMessage: 'Enter Details',
  });

  return (
    <EuiForm id={formId} onSubmit={handleFormSubmit} component="form">
      <EuiPanel>
        <EuiTitle size="s">
          <h2>{workspaceDetailsTitle}</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFormRow
          label={i18n.translate('workspace.form.workspaceDetails.name.label', {
            defaultMessage: 'Name',
          })}
          helpText={i18n.translate('workspace.form.workspaceDetails.name.helpText', {
            defaultMessage:
              'Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
          })}
          isInvalid={!!formErrors.name}
          error={formErrors.name}
        >
          <EuiFieldText
            value={formData.name}
            onChange={handleNameInputChange}
            readOnly={!!defaultValues?.reserved}
            data-test-subj="workspaceForm-workspaceDetails-nameInputText"
            placeholder={i18n.translate('workspace.form.workspaceDetails.name.placeholder', {
              defaultMessage: 'Enter a name',
            })}
          />
        </EuiFormRow>
        <EuiFormRow
          label={
            <>
              Description - <i>optional</i>
            </>
          }
          isInvalid={!!formErrors.description}
          error={formErrors.description}
        >
          <>
            <EuiText size="xs" color="subdued">
              {i18n.translate('workspace.form.workspaceDetails.description.introduction', {
                defaultMessage:
                  'Help others understand the purpose of this workspace by providing an overview of the workspace you’re creating.',
              })}
            </EuiText>
            <EuiTextArea
              value={formData.description}
              onChange={handleDescriptionChange}
              data-test-subj="workspaceForm-workspaceDetails-descriptionInputText"
              rows={4}
              placeholder={i18n.translate(
                'workspace.form.workspaceDetails.description.placeholder',
                {
                  defaultMessage: 'Describe the workspace',
                }
              )}
            />
          </>
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('workspace.form.workspaceDetails.color.label', {
            defaultMessage: 'Color',
          })}
          isInvalid={!!formErrors.color}
          error={formErrors.color}
        >
          <div>
            <EuiText size="xs" color="subdued">
              {i18n.translate('workspace.form.workspaceDetails.color.helpText', {
                defaultMessage: 'Accent color for your workspace',
              })}
            </EuiText>
            <EuiSpacer size={'s'} />
            <EuiColorPicker
              color={formData.color}
              onChange={handleColorChange}
              data-test-subj="workspaceForm-workspaceDetails-colorPicker"
            />
          </div>
        </EuiFormRow>
      </EuiPanel>
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle size="s">
          <h2>
            {i18n.translate('workspace.form.workspaceUseCase.title', {
              defaultMessage: 'Choose one or more focus areas',
            })}
          </h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFormRow
          label={i18n.translate('workspace.form.workspaceUseCase.name.label', {
            defaultMessage: 'Use case',
          })}
          isInvalid={!!formErrors.features}
          error={formErrors.features}
          fullWidth
        >
          <WorkspaceUseCase
            availableUseCases={availableUseCases}
            value={formData.useCases}
            onChange={handleUseCasesChange}
          />
        </EuiFormRow>
      </EuiPanel>
      <EuiSpacer />
      {permissionEnabled && (
        <EuiPanel>
          <EuiTitle size="s">
            <h2>
              {i18n.translate('workspace.form.usersAndPermissions.title', {
                defaultMessage: 'Manage access and permissions',
              })}
            </h2>
          </EuiTitle>
          <WorkspacePermissionSettingPanel
            errors={formErrors.permissionSettings}
            onChange={setPermissionSettings}
            permissionSettings={formData.permissionSettings}
            lastAdminItemDeletable={!!permissionLastAdminItemDeletable}
            data-test-subj={`workspaceForm-permissionSettingPanel`}
          />
        </EuiPanel>
      )}
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle size="s">
          <h2>
            {i18n.translate('workspace.form.selectDataSource.title', {
              defaultMessage: 'Select Data Sources',
            })}
          </h2>
        </EuiTitle>
        <SelectDataSourcePanel
          errors={formErrors.selectedDataSources}
          onChange={setSelectedDataSources}
          savedObjects={savedObjects}
          selectedDataSources={formData.selectedDataSources}
          data-test-subj={`workspaceForm-dataSourcePanel`}
        />
      </EuiPanel>
      <EuiSpacer />
      <WorkspaceBottomBar
        operationType={operationType}
        formId={formId}
        application={application}
        numberOfErrors={numberOfErrors}
      />
    </EuiForm>
  );
};
