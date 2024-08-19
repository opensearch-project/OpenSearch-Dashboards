/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { EuiPanel, EuiSpacer, EuiTitle, EuiForm } from '@elastic/eui';

import { WorkspaceFormProps } from './types';
import { useWorkspaceForm } from './use_workspace_form';
import { WorkspacePermissionSettingPanel } from './workspace_permission_setting_panel';
import { WorkspaceUseCase } from './workspace_use_case';
import { WorkspaceFormErrorCallout } from './workspace_form_error_callout';
import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';
import { SelectDataSourcePanel } from './select_data_source_panel';
import { EnterDetailsPanel } from './workspace_enter_details_panel';
import {
  selectDataSourceTitle,
  usersAndPermissionsTitle,
  workspaceDetailsTitle,
  workspaceUseCaseTitle,
} from './constants';

export const WorkspaceForm = (props: WorkspaceFormProps) => {
  const {
    application,
    savedObjects,
    defaultValues,
    permissionEnabled,
    dataSourceManagement: isDataSourceEnabled,
    availableUseCases,
    operationType,
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
    handleUseCaseChange,
    setPermissionSettings,
    setSelectedDataSources,
  } = useWorkspaceForm(props);

  const disabledUserOrGroupInputIdsRef = useRef(
    defaultValues?.permissionSettings?.map((item) => item.id) ?? []
  );
  // const isDashboardAdmin = application?.capabilities?.dashboards?.isDashboardAdmin ?? false;
  const isDashboardAdmin = !!application?.capabilities?.dashboards?.isDashboardAdmin;

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
        <EnterDetailsPanel
          formErrors={formErrors}
          name={formData.name}
          description={formData.description}
          color={formData.color}
          readOnly={!!defaultValues?.reserved}
          handleColorChange={handleColorChange}
          onNameChange={setName}
          onDescriptionChange={setDescription}
        />
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
          savedObjects={savedObjects}
          operationType={operationType}
        />
      </EuiPanel>
      <EuiSpacer />
      {permissionEnabled && (
        <EuiPanel>
          <EuiTitle size="s">
            <h2>{usersAndPermissionsTitle}</h2>
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
            data-test-subj={`workspaceForm-dataSourcePanel`}
            isDashboardAdmin={isDashboardAdmin}
            assignedDataSources={formData.selectedDataSources}
          />
        </EuiPanel>
      )}
      <EuiSpacer />
      <WorkspaceCreateActionPanel formData={formData} formId={formId} application={application} />
    </EuiForm>
  );
};
