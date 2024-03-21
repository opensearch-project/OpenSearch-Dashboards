/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { WorkspaceOperationType } from '../workspace_form';
import { WorkspaceCancelModal } from './workspace_cancel_modal';

interface WorkspaceBottomBarProps {
  formId: string;
  operationType?: WorkspaceOperationType;
  numberOfErrors: number;
  application: ApplicationStart;
  numberOfUnSavedChanges?: number;
}

export const WorkspaceBottomBar = ({
  formId,
  operationType,
  numberOfErrors,
  numberOfUnSavedChanges,
  application,
}: WorkspaceBottomBarProps) => {
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const closeCancelModal = () => setIsCancelModalVisible(false);
  const showCancelModal = () => setIsCancelModalVisible(true);

  return (
    <div>
      <EuiSpacer size="xl" />
      <EuiSpacer size="xl" />
      <EuiBottomBar>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s">
              {operationType === WorkspaceOperationType.Update ? (
                <EuiText textAlign="left">
                  {i18n.translate('workspace.form.bottomBar.unsavedChanges', {
                    defaultMessage: '{numberOfUnSavedChanges} Unsaved change(s)',
                    values: {
                      numberOfUnSavedChanges,
                    },
                  })}
                </EuiText>
              ) : (
                <EuiText textAlign="left">
                  {i18n.translate('workspace.form.bottomBar.errors', {
                    defaultMessage: '{numberOfErrors} Error(s)',
                    values: {
                      numberOfErrors,
                    },
                  })}
                </EuiText>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="m">
              <EuiButtonEmpty
                color="ghost"
                onClick={showCancelModal}
                data-test-subj="workspaceForm-bottomBar-cancelButton"
              >
                {i18n.translate('workspace.form.bottomBar.cancel', {
                  defaultMessage: 'Cancel',
                })}
              </EuiButtonEmpty>
              <EuiSpacer />
              {operationType === WorkspaceOperationType.Create && (
                <EuiButton
                  fill
                  type="submit"
                  color="primary"
                  form={formId}
                  data-test-subj="workspaceForm-bottomBar-createButton"
                >
                  {i18n.translate('workspace.form.bottomBar.createWorkspace', {
                    defaultMessage: 'Create workspace',
                  })}
                </EuiButton>
              )}
              {operationType === WorkspaceOperationType.Update && (
                <EuiButton
                  form={formId}
                  type="submit"
                  fill
                  color="primary"
                  data-test-subj="workspaceForm-bottomBar-updateButton"
                >
                  {i18n.translate('workspace.form.bottomBar.saveChanges', {
                    defaultMessage: 'Save changes',
                  })}
                </EuiButton>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
      <WorkspaceCancelModal
        application={application}
        visible={isCancelModalVisible}
        closeCancelModal={closeCancelModal}
      />
    </div>
  );
};
