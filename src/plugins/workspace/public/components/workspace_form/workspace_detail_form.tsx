/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { WorkspaceFormProps } from './types';
import { WorkspacePermissionSettingPanel } from './workspace_permission_setting_panel';
import { DetailTab, usersAndPermissionsTitle } from './constants';
import { WorkspaceFormErrorCallout } from './workspace_form_error_callout';
import { useWorkspaceFormContext } from './workspace_form_context';
import { WorkspaceDetailFormDetails } from './workspace_detail_form_details';

interface FormGroupProps {
  title: React.ReactNode;
  children: React.ReactNode;
  describe?: string;
}

const FormGroup = ({ title, children, describe }: FormGroupProps) => (
  <>
    <EuiFlexGroup gutterSize="xl">
      <EuiFlexItem grow={false} style={{ width: '15%' }}>
        <EuiTitle size="xs">
          <h3>{title}</h3>
        </EuiTitle>
        <EuiText size="xs" color="subdued">
          {describe}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiSpacer size="s" />
        {children}
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer />
  </>
);

interface WorkspaceDetailedFormProps extends WorkspaceFormProps {
  detailTab?: DetailTab;
  detailTitle?: string;
}

export const WorkspaceDetailForm = (props: WorkspaceDetailedFormProps) => {
  const { detailTab, detailTitle, defaultValues, availableUseCases } = props;
  const {
    formId,
    formData,
    isEditing,
    formErrors,
    setIsEditing,
    numberOfErrors,
    numberOfChanges,
    handleResetForm,
    handleFormSubmit,
    setPermissionSettings,
  } = useWorkspaceFormContext();
  const disabledUserOrGroupInputIdsRef = useRef(
    defaultValues?.permissionSettings?.map((item) => item.id) ?? []
  );

  const [isSaving, setIsSaving] = useState(false);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isSaving && isEditing && numberOfChanges > 0) {
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, isSaving, numberOfChanges]);

  return (
    <EuiForm
      id={formId}
      onSubmit={(event) => {
        setIsSaving(true);
        handleFormSubmit(event);
      }}
      component="form"
    >
      {numberOfErrors > 0 && (
        <>
          <WorkspaceFormErrorCallout errors={formErrors} />
          <EuiSpacer />
        </>
      )}
      <EuiPanel>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h2>{detailTitle}</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {isEditing ? (
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
        <EuiHorizontalRule />
        {detailTab === DetailTab.Details && (
          <WorkspaceDetailFormDetails availableUseCases={availableUseCases} />
        )}
        {detailTab === DetailTab.Collaborators && (
          <FormGroup title={usersAndPermissionsTitle}>
            <WorkspacePermissionSettingPanel
              errors={formErrors.permissionSettings?.fields}
              onChange={setPermissionSettings}
              permissionSettings={formData.permissionSettings}
              disabledUserOrGroupInputIds={disabledUserOrGroupInputIdsRef.current}
              data-test-subj={`workspaceForm-permissionSettingPanel`}
              isEditing={isEditing}
            />
          </FormGroup>
        )}
      </EuiPanel>
      <EuiSpacer />
    </EuiForm>
  );
};
