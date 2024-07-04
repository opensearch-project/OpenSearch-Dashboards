/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiText,
  EuiTextArea,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { WorkspaceBottomBar } from './workspace_bottom_bar';
import { WorkspaceFormProps } from './types';
import { useWorkspaceForm } from './use_workspace_form';
import { WorkspacePermissionSettingPanel } from './workspace_permission_setting_panel';
import { WorkspaceUseCase } from './workspace_use_case';
import { WorkspaceOperationType } from './constants';
import { WorkspaceFormErrorCallout } from './workspace_form_error_callout';
import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';

export const WorkspaceForm = (props: WorkspaceFormProps) => {
  const {
    application,
    defaultValues,
    operationType,
    permissionEnabled,
    workspaceConfigurableApps,
  } = props;
  const {
    formId,
    formData,
    formErrors,
    numberOfErrors,
    numberOfChanges,
    handleFormSubmit,
    handleUseCasesChange,
    handleNameInputChange,
    setPermissionSettings,
    handleDescriptionChange,
  } = useWorkspaceForm(props);
  const workspaceDetailsTitle = i18n.translate('workspace.form.workspaceDetails.title', {
    defaultMessage: 'Enter details',
  });
  const disabledUserOrGroupInputIdsRef = useRef(
    defaultValues?.permissionSettings?.map((item) => item.id) ?? []
  );

  return (
    <EuiForm id={formId} onSubmit={handleFormSubmit} component="form">
      {numberOfErrors > 0 && (
        <>
          <WorkspaceFormErrorCallout errors={formErrors} />
          <EuiSpacer />
        </>
      )}

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
          error={formErrors.name?.message}
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
          error={formErrors.features?.message}
          fullWidth
        >
          <WorkspaceUseCase
            configurableApps={workspaceConfigurableApps}
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
          <EuiSpacer size="m" />
          <WorkspacePermissionSettingPanel
            errors={formErrors.permissionSettings?.fields}
            onChange={setPermissionSettings}
            permissionSettings={formData.permissionSettings}
            disabledUserOrGroupInputIds={disabledUserOrGroupInputIdsRef.current}
            data-test-subj={`workspaceForm-permissionSettingPanel`}
          />
        </EuiPanel>
      )}
      <EuiSpacer />
      {operationType === WorkspaceOperationType.Create && (
        <WorkspaceCreateActionPanel formId={formId} application={application} />
      )}
      {operationType === WorkspaceOperationType.Update && (
        <WorkspaceBottomBar
          formId={formId}
          application={application}
          numberOfChanges={numberOfChanges}
        />
      )}
    </EuiForm>
  );
};
