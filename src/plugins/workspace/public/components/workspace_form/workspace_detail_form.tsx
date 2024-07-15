/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { EuiPanel, EuiSpacer, EuiForm, EuiDescribedFormGroup } from '@elastic/eui';

import { WorkspaceBottomBar } from './workspace_bottom_bar';
import { WorkspaceFormProps } from './types';
import { useWorkspaceForm } from './use_workspace_form';
import { WorkspaceUseCase } from './workspace_use_case';
import { WorkspacePermissionSettingPanel } from './workspace_permission_setting_panel';
import { SelectDataSourcePanel } from './select_data_source_panel';
import { EnterDetailsPanel } from './workspace_enter_details_panel';
import {
  DetailTab,
  WorkspaceOperationType,
  selectDataSourceTitle,
  usersAndPermissionsTitle,
  workspaceDetailsTitle,
  workspaceUseCaseTitle,
} from './constants';
import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';
import { WorkspaceFormErrorCallout } from './workspace_form_error_callout';

export const WorkspaceDetailForm = (props: WorkspaceFormProps) => {
  const {
    tab,
    application,
    savedObjects,
    defaultValues,
    operationType,
    workspaceConfigurableApps,
  } = props;
  const {
    formId,
    formData,
    formErrors,
    numberOfErrors,
    numberOfChanges,
    handleFormSubmit,
    handleColorChange,
    handleUseCasesChange,
    setPermissionSettings,
    handleNameInputChange,
    setSelectedDataSources,
    handleDescriptionChange,
  } = useWorkspaceForm(props);

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
        {tab === DetailTab.Collaborators && (
          <EuiDescribedFormGroup title={<h3>{usersAndPermissionsTitle}</h3>}>
            <WorkspacePermissionSettingPanel
              errors={formErrors.permissionSettings?.fields}
              onChange={setPermissionSettings}
              permissionSettings={formData.permissionSettings}
              disabledUserOrGroupInputIds={disabledUserOrGroupInputIdsRef.current}
              data-test-subj={`workspaceForm-permissionSettingPanel`}
            />
          </EuiDescribedFormGroup>
        )}
        {tab === DetailTab.Settings && (
          <>
            <EuiDescribedFormGroup title={<h3>{workspaceDetailsTitle}</h3>}>
              <EnterDetailsPanel
                formErrors={formErrors}
                name={formData.name}
                description={formData.description}
                color={formData.color}
                readOnly={!!defaultValues?.reserved}
                handleNameInputChange={handleNameInputChange}
                handleDescriptionChange={handleDescriptionChange}
                handleColorChange={handleColorChange}
              />
            </EuiDescribedFormGroup>
            <EuiDescribedFormGroup title={<h3>{workspaceUseCaseTitle}</h3>}>
              <WorkspaceUseCase
                configurableApps={workspaceConfigurableApps}
                value={formData.useCases}
                onChange={handleUseCasesChange}
                formErrors={formErrors}
              />
            </EuiDescribedFormGroup>
            <EuiDescribedFormGroup title={<h3>{selectDataSourceTitle}</h3>}>
              <SelectDataSourcePanel
                errors={formErrors.selectedDataSources}
                onChange={setSelectedDataSources}
                savedObjects={savedObjects}
                selectedDataSources={formData.selectedDataSources}
                data-test-subj={`workspaceForm-dataSourcePanel`}
              />
            </EuiDescribedFormGroup>
          </>
        )}
      </EuiPanel>
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
