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
import { WORKSPACE_OP_TYPE_CREATE, WORKSPACE_OP_TYPE_UPDATE } from '../../../common/constants';
import { WorkspaceCancelModal } from './workspace_cancel_modal';

interface WorkspaceBottomBarProps {
  formId: string;
  opType?: string;
  numberOfErrors: number;
  application: ApplicationStart;
}

// Number of saved changes will be implemented in workspace update page PR
export const WorkspaceBottomBar = ({
  formId,
  opType,
  numberOfErrors,
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
              {opType === WORKSPACE_OP_TYPE_UPDATE ? (
                <EuiText textAlign="left">
                  {i18n.translate('workspace.form.bottomBar.unsavedChanges', {
                    defaultMessage: '1 Unsaved change(s)',
                  })}
                </EuiText>
              ) : (
                <EuiText textAlign="left">
                  {i18n.translate('workspace.form.bottomBar.errors', {
                    defaultMessage: `${numberOfErrors} Error(s)`,
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
              {opType === WORKSPACE_OP_TYPE_CREATE && (
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
              {opType === WORKSPACE_OP_TYPE_UPDATE && (
                <EuiButton form={formId} type="submit" fill color="primary">
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
