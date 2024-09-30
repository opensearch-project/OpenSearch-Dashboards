/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';
import {
  EuiSpacer,
  EuiTitle,
  EuiForm,
  EuiText,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  useWorkspaceForm,
  WorkspacePermissionSettingPanel,
  WorkspaceUseCase,
  WorkspaceFormErrorCallout,
  SelectDataSourcePanel,
  usersAndPermissionsCreatePageTitle,
  WorkspaceFormProps,
} from '../workspace_form';

import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';
import { WorkspaceFaqPanel } from './workspace_faq_panel';
import { WorkspaceFormSummaryPanel } from './workspace_form_summary_panel';
import { generateRightSidebarScrollProps, RightSidebarScrollField } from './utils';
import { CreatorDetailsPanel } from './creator_details_panel';

import './workspace_creator_form.scss';

interface WorkspaceCreatorFormProps extends WorkspaceFormProps {
  isSubmitting: boolean;
}

export const WorkspaceCreatorForm = (props: WorkspaceCreatorFormProps) => {
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
    setSelectedDataSourceConnections,
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
    <EuiFlexGroup className="workspaceCreateFormContainer">
      <EuiFlexItem style={{ maxWidth: 848 }}>
        <EuiForm
          id={formId}
          onSubmit={handleFormSubmit}
          component="form"
          data-test-subj="workspaceCreatorForm"
        >
          {numberOfErrors > 0 && (
            <>
              <WorkspaceFormErrorCallout errors={formErrors} />
              <EuiSpacer />
            </>
          )}
          <CreatorDetailsPanel
            name={formData.name}
            color={formData.color}
            description={formData.description}
            onNameChange={handleNameInputChange}
            onColorChange={handleColorChange}
            onDescriptionChange={setDescription}
          />
          <EuiSpacer size="m" />
          <div {...generateRightSidebarScrollProps(RightSidebarScrollField.UseCase)}>
            <WorkspaceUseCase
              value={formData.useCase}
              onChange={handleUseCaseChange}
              formErrors={formErrors}
              availableUseCases={availableUseCases}
            />
          </div>
          <EuiSpacer size="m" />
          {/* SelectDataSourcePanel is only visible for dashboard admin and when data source is enabled*/}
          {isDashboardAdmin && isDataSourceEnabled && (
            <EuiPanel>
              <EuiTitle
                {...generateRightSidebarScrollProps(RightSidebarScrollField.DataSource)}
                size="s"
              >
                <h3>
                  {i18n.translate('workspace.creator.form.associateDataSourceTitle', {
                    defaultMessage: 'Associate data sources',
                  })}
                </h3>
              </EuiTitle>
              <EuiText size="xs">
                {i18n.translate('workspace.creator.form.associateDataSourceDescription', {
                  defaultMessage:
                    'Add at least one data source that will be available in the workspace. If a selected OpenSearch connection has related Direct Query connections, they will also be available in the workspace.',
                })}
              </EuiText>
              <SelectDataSourcePanel
                onChange={setSelectedDataSourceConnections}
                savedObjects={savedObjects}
                assignedDataSourceConnections={formData.selectedDataSourceConnections}
                data-test-subj={`workspaceForm-dataSourcePanel`}
                showDataSourceManagement={true}
              />
            </EuiPanel>
          )}
          <EuiSpacer size="s" />
          <EuiSpacer size="s" />
          {permissionEnabled && (
            <>
              <EuiTitle
                {...generateRightSidebarScrollProps(RightSidebarScrollField.Member)}
                size="s"
              >
                <h3>{usersAndPermissionsCreatePageTitle}</h3>
              </EuiTitle>
              <EuiText size="xs">
                {i18n.translate('workspace.creator.form.usersAndPermissionsDescription', {
                  defaultMessage:
                    'You will be added as an owner to the workspace. Select additional users and user groups as workspace collaborators with different access levels.',
                })}
              </EuiText>
              <EuiSpacer size="m" />
              <WorkspacePermissionSettingPanel
                errors={formErrors.permissionSettings?.fields}
                onChange={setPermissionSettings}
                permissionSettings={formData.permissionSettings}
                disabledUserOrGroupInputIds={disabledUserOrGroupInputIdsRef.current}
                data-test-subj={`workspaceForm-permissionSettingPanel`}
              />
            </>
          )}
        </EuiForm>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <div className="workspaceCreateRightSidebar">
          <div className="workspaceCreateRightSideBarContentWrapper">
            <WorkspaceFaqPanel />
            <EuiSpacer size="m" />
            <WorkspaceFormSummaryPanel
              formData={formData}
              availableUseCases={availableUseCases}
              permissionEnabled={permissionEnabled}
            />
          </div>
          <EuiSpacer size="m" />
          <div className="workspaceCreateRightSideBarActionsWrapper">
            <WorkspaceCreateActionPanel
              formData={formData}
              formId={formId}
              application={application}
              isSubmitting={props.isSubmitting}
            />
          </div>
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
