/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiSpacer,
  EuiForm,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiPanel,
  EuiSmallButton,
  EuiHorizontalRule,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { WorkspaceFormProps } from './types';
import { DetailTab } from './constants';
import { WorkspaceFormErrorCallout } from './workspace_form_error_callout';
import { useWorkspaceFormContext } from './workspace_form_context';
import { WorkspaceDetailFormDetails } from './workspace_detail_form_details';
import { WorkspaceCollaboratorTable } from './workspace_collaborator_table';
import {
  WorkspaceCollaboratorType,
  WorkspaceCollaboratorTypesService,
} from '../../services/workspace_collaborator_types_service';
import { AddCollaboratorButton } from './add_collaborator_button';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

const EMPTY_COLLABORATOR_TYPES: WorkspaceCollaboratorType[] = [];

interface WorkspaceDetailedFormProps extends Omit<WorkspaceFormProps, 'onAppLeave'> {
  detailTab?: DetailTab;
  detailTitle?: string;
}

export const WorkspaceDetailForm = (props: WorkspaceDetailedFormProps) => {
  const { detailTab, detailTitle, availableUseCases } = props;
  const {
    formId,
    formData,
    isEditing,
    formErrors,
    setIsEditing,
    numberOfErrors,
    handleResetForm,
    handleFormSubmit,
    handleSubmitPermissionSettings,
  } = useWorkspaceFormContext();

  const {
    services: { collaboratorTypes },
  } = useOpenSearchDashboards<{ collaboratorTypes: WorkspaceCollaboratorTypesService }>();

  const displayedCollaboratorTypes =
    useObservable(collaboratorTypes.getTypes$()) ?? EMPTY_COLLABORATOR_TYPES;

  return (
    <EuiForm
      id={formId}
      onSubmit={(event) => {
        handleFormSubmit(event);
      }}
      component="form"
    >
      <EuiPanel>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h2>{detailTitle}</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {detailTab === DetailTab.Collaborators ? (
              <AddCollaboratorButton
                displayedTypes={displayedCollaboratorTypes}
                permissionSettings={formData.permissionSettings}
                handleSubmitPermissionSettings={handleSubmitPermissionSettings}
              />
            ) : isEditing ? (
              <EuiSmallButton
                onClick={handleResetForm}
                data-test-subj="workspaceForm-workspaceDetails-discardChanges"
              >
                {i18n.translate('workspace.detail.button.discardChanges', {
                  defaultMessage: 'Discard changes',
                })}
              </EuiSmallButton>
            ) : (
              <EuiSmallButton
                onClick={() => setIsEditing((prevIsEditing) => !prevIsEditing)}
                data-test-subj="workspaceForm-workspaceDetails-edit"
              >
                {i18n.translate('workspace.detail.button.edit', {
                  defaultMessage: 'Edit',
                })}
              </EuiSmallButton>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiText size="s">
          {i18n.translate('workspace.detail.collaborator.description', {
            defaultMessage: 'Manage workspace access and permissions.',
          })}
        </EuiText>
        {detailTab === DetailTab.Collaborators ? (
          <EuiSpacer size="m" />
        ) : (
          <EuiHorizontalRule margin="m" />
        )}
        {numberOfErrors > 0 && (
          <>
            <WorkspaceFormErrorCallout errors={formErrors} />
            <EuiSpacer />
          </>
        )}
        {detailTab === DetailTab.Details && (
          <WorkspaceDetailFormDetails availableUseCases={availableUseCases} />
        )}
        {detailTab === DetailTab.Collaborators && (
          <WorkspaceCollaboratorTable
            permissionSettings={formData.permissionSettings}
            displayedCollaboratorTypes={displayedCollaboratorTypes}
            handleSubmitPermissionSettings={handleSubmitPermissionSettings}
          />
        )}
      </EuiPanel>
      <EuiSpacer />
    </EuiForm>
  );
};
