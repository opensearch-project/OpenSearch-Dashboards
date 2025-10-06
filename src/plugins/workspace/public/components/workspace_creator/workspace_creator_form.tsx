/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSpacer, EuiForm, EuiText, EuiFlexItem, EuiFlexGroup, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  useWorkspaceForm,
  WorkspaceUseCase,
  WorkspaceFormErrorCallout,
  SelectDataSourcePanel,
  WorkspaceFormProps,
} from '../workspace_form';

import { WorkspaceFormSummaryPanel } from './workspace_form_summary_panel';
import { generateRightSidebarScrollProps, RightSidebarScrollField } from './utils';
import { CreatorDetailsPanel } from './creator_details_panel';

import './workspace_creator_form.scss';
import { WorkspacePrivacySettingPanel } from '../workspace_form/workspace_privacy_setting_panel';

interface WorkspaceCreatorFormProps extends WorkspaceFormProps {
  isSubmitting: boolean;
  goToCollaborators: boolean;
  onGoToCollaboratorsChange: (value: boolean) => void;
}

export const WorkspaceCreatorForm = (props: WorkspaceCreatorFormProps) => {
  const {
    application,
    savedObjects,
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
    handleUseCaseChange,
    setSelectedDataSourceConnections,
    privacyType,
    setPrivacyType,
  } = useWorkspaceForm(props);

  const isDashboardAdmin = application?.capabilities?.dashboards?.isDashboardAdmin ?? false;
  const isPermissionEnabled = !!application?.capabilities.workspaces.permissionEnabled;

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
            onNameChange={setName}
            onColorChange={handleColorChange}
            onDescriptionChange={setDescription}
            formErrors={formErrors}
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
            <>
              <EuiPanel>
                <EuiText
                  {...generateRightSidebarScrollProps(RightSidebarScrollField.DataSource)}
                  size="s"
                >
                  <h2>
                    {i18n.translate('workspace.creator.form.associateDataSourceTitle', {
                      defaultMessage: 'Associate data sources',
                    })}
                  </h2>
                </EuiText>
                <EuiText size="xs">
                  {i18n.translate('workspace.creator.form.associateDataSourceDescription', {
                    defaultMessage:
                      'Add at least one data source that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.',
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
            </>
          )}
          <EuiSpacer size="m" />
          {isDashboardAdmin && isPermissionEnabled && (
            <WorkspacePrivacySettingPanel
              privacyType={privacyType}
              onPrivacyTypeChange={setPrivacyType}
              goToCollaborators={props.goToCollaborators}
              onGoToCollaboratorsChange={props.onGoToCollaboratorsChange}
            />
          )}
        </EuiForm>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <div className="workspaceCreateRightSidebar">
          <div className="workspaceCreateRightSideBarContentWrapper">
            <WorkspaceFormSummaryPanel
              formData={formData}
              availableUseCases={availableUseCases}
              formId={formId}
              application={application}
              isSubmitting={props.isSubmitting}
              dataSourceEnabled={!!isDataSourceEnabled}
              privacyType={privacyType}
            />
          </div>
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
