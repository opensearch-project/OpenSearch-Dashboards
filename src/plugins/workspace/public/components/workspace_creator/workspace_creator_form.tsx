/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiForm,
  EuiText,
  EuiCompressedFormRow,
  EuiColorPicker,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  useWorkspaceForm,
  WorkspacePermissionSettingPanel,
  WorkspaceUseCase,
  WorkspaceFormErrorCallout,
  SelectDataSourcePanel,
  usersAndPermissionsCreatePageTitle,
  selectDataSourceTitle,
  workspaceDetailsTitle,
  workspaceUseCaseTitle,
  WorkspaceFormProps,
  WorkspaceNameField,
  WorkspaceDescriptionField,
} from '../workspace_form';

import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';

export const WorkspaceCreatorForm = (props: WorkspaceFormProps) => {
  const {
    application,
    savedObjects,
    defaultValues,
    permissionEnabled,
    dataSourceManagement: isDataSourceEnabled,
    availableUseCases,
  } = props;
  const {
    formId,
    formData,
    formErrors,
    numberOfErrors,
    setName,
    setDescription,
    handleFormSubmit,
    handleColorChange,
    handleUseCaseChange: handleUseCaseChangeInHook,
    setPermissionSettings,
    setSelectedDataSources,
  } = useWorkspaceForm(props);
  const nameManualChangedRef = useRef(false);

  const disabledUserOrGroupInputIdsRef = useRef(
    defaultValues?.permissionSettings?.map((item) => item.id) ?? []
  );
  const isDashboardAdmin = application?.capabilities?.dashboards?.isDashboardAdmin ?? false;
  const handleNameInputChange = useCallback(
    (newName) => {
      setName(newName);
      nameManualChangedRef.current = true;
    },
    [setName]
  );
  const handleUseCaseChange = useCallback(
    (newUseCase) => {
      handleUseCaseChangeInHook(newUseCase);
      const useCase = availableUseCases.find((item) => newUseCase === item.id);
      if (!nameManualChangedRef.current && useCase) {
        setName(useCase.title);
      }
    },
    [handleUseCaseChangeInHook, availableUseCases, setName]
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
        <WorkspaceNameField
          value={formData.name}
          onChange={handleNameInputChange}
          error={formErrors.name?.message}
        />
        <WorkspaceDescriptionField
          value={formData.description}
          onChange={setDescription}
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
                defaultMessage:
                  'Select a background color for the icon representing this workspace.',
              })}
            </EuiText>
            <EuiSpacer size={'s'} />
            <EuiColorPicker
              color={formData.color}
              onChange={handleColorChange}
              data-test-subj="workspaceForm-workspaceDetails-colorPicker"
            />
          </div>
        </EuiCompressedFormRow>
      </EuiPanel>
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle size="s">
          <h2>{workspaceUseCaseTitle}</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <WorkspaceUseCase
          value={formData.useCase}
          onChange={handleUseCaseChange}
          formErrors={formErrors}
          availableUseCases={availableUseCases}
        />
      </EuiPanel>
      <EuiSpacer />
      {permissionEnabled && (
        <EuiPanel>
          <EuiTitle size="s">
            <h2>{usersAndPermissionsCreatePageTitle}</h2>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText size="xs" color="default">
            {i18n.translate('workspace.form.usersAndPermissions.description', {
              defaultMessage:
                'You will be added as an owner to the workspace. Select additional users and user groups as workspace collaborators with different access levels.',
            })}
          </EuiText>
          <EuiSpacer size="l" />
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

      {/* SelectDataSourcePanel is only visible for dashboard admin and when data source is enabled*/}
      {isDashboardAdmin && isDataSourceEnabled && (
        <EuiPanel>
          <EuiTitle size="s">
            <h2>{selectDataSourceTitle}</h2>
          </EuiTitle>
          <SelectDataSourcePanel
            errors={formErrors.selectedDataSources}
            onChange={setSelectedDataSources}
            savedObjects={savedObjects}
            selectedDataSources={formData.selectedDataSources}
            data-test-subj={`workspaceForm-dataSourcePanel`}
          />
        </EuiPanel>
      )}
      <EuiSpacer />
      <WorkspaceCreateActionPanel formData={formData} formId={formId} application={application} />
    </EuiForm>
  );
};
