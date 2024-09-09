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
  EuiCompressedFormRow,
  EuiColorPicker,
  EuiFlexItem,
  EuiFlexGroup,
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
  WorkspaceNameField,
  WorkspaceDescriptionField,
} from '../workspace_form';

import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';
import { WorkspaceFaqPanel } from './workspace_faq_panel';
import { WorkspaceFormSummaryPanel } from './workspace_form_summary_panel';
import { generateRightSidebarScrollProps, RightSidebarScrollField } from './utils';

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
      <EuiFlexItem style={{ maxWidth: 768 }}>
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
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('workspace.creator.form.customizeTitle', {
                defaultMessage: 'Customize the workspace',
              })}
            </h3>
          </EuiTitle>
          <div {...generateRightSidebarScrollProps(RightSidebarScrollField.UseCase)}>
            <WorkspaceUseCase
              value={formData.useCase}
              onChange={handleUseCaseChange}
              formErrors={formErrors}
              availableUseCases={availableUseCases}
            />
          </div>
          <EuiSpacer size="m" />
          <div {...generateRightSidebarScrollProps(RightSidebarScrollField.Name)} />
          <WorkspaceNameField
            value={formData.name}
            onChange={handleNameInputChange}
            error={formErrors.name?.message}
          />
          <EuiSpacer size="m" />
          <div {...generateRightSidebarScrollProps(RightSidebarScrollField.Description)} />
          <WorkspaceDescriptionField value={formData.description} onChange={setDescription} />
          <EuiSpacer size="m" />
          <EuiCompressedFormRow
            label={i18n.translate('workspace.form.workspaceDetails.color.label', {
              defaultMessage: 'Workspace icon color',
            })}
            isInvalid={!!formErrors.color}
            error={formErrors.color?.message}
            {...generateRightSidebarScrollProps(RightSidebarScrollField.Color)}
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
          <EuiSpacer />
          {/* SelectDataSourcePanel is only visible for dashboard admin and when data source is enabled*/}
          {isDashboardAdmin && isDataSourceEnabled && (
            <>
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
                    'Add data sources that will be available in the workspace. If a selected OpenSearch connection has embedded Direct Query connection, they will also be available in the workspace.',
                })}
              </EuiText>
              <SelectDataSourcePanel
                onChange={setSelectedDataSourceConnections}
                savedObjects={savedObjects}
                assignedDataSourceConnections={formData.selectedDataSourceConnections}
                data-test-subj={`workspaceForm-dataSourcePanel`}
                showDataSourceManagement={true}
              />
              <EuiSpacer size="s" />
              <EuiSpacer size="s" />
            </>
          )}
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
