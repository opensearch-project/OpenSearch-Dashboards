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
  EuiSmallButton,
  EuiHorizontalRule,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { WorkspaceFormProps } from '../workspace_form/types';
import { WorkspaceFormErrorCallout } from '../workspace_form/workspace_form_error_callout';
import { useWorkspaceFormContext } from '../workspace_form/workspace_form_context';
import { WorkspaceDetailFormContent } from './workspace_detail_form_content';

export const WorkspaceDetailForm = (props: Omit<WorkspaceFormProps, 'onAppLeave'>) => {
  const { availableUseCases } = props;
  const {
    formId,
    isEditing,
    formErrors,
    setIsEditing,
    numberOfErrors,
    handleResetForm,
    handleFormSubmit,
  } = useWorkspaceFormContext();

  return (
    <EuiForm
      id={formId}
      onSubmit={(event) => {
        handleFormSubmit(event);
      }}
      component="form"
    >
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h2>
              {i18n.translate('workspace.detail.form.title', {
                defaultMessage: 'Details',
              })}
            </h2>
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
              minWidth="30px"
            >
              {i18n.translate('workspace.detail.button.edit', {
                defaultMessage: 'Edit',
              })}
            </EuiSmallButton>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiHorizontalRule margin="m" />
      {numberOfErrors > 0 && (
        <>
          <WorkspaceFormErrorCallout errors={formErrors} />
          <EuiSpacer />
        </>
      )}
      <WorkspaceDetailFormContent availableUseCases={availableUseCases} />
    </EuiForm>
  );
};
