/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiSmallButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState, useCallback } from 'react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { WorkspaceCancelModal } from './workspace_cancel_modal';

interface WorkspaceCreateActionPanelProps {
  formId: string;
  application: ApplicationStart;
}

export const WorkspaceCreateActionPanel = ({
  formId,
  application,
}: WorkspaceCreateActionPanelProps) => {
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const closeCancelModal = useCallback(() => setIsCancelModalVisible(false), []);
  const showCancelModal = useCallback(() => setIsCancelModalVisible(true), []);

  return (
    <>
      <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            data-test-subj="workspaceForm-bottomBar-cancelButton"
            onClick={showCancelModal}
          >
            {i18n.translate('workspace.form.bottomBar.cancel', {
              defaultMessage: 'Cancel',
            })}
          </EuiSmallButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            fill
            type="submit"
            form={formId}
            data-test-subj="workspaceForm-bottomBar-createButton"
          >
            {i18n.translate('workspace.form.bottomBar.createWorkspace', {
              defaultMessage: 'Create workspace',
            })}
          </EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      {isCancelModalVisible && (
        <WorkspaceCancelModal application={application} closeCancelModal={closeCancelModal} />
      )}
    </>
  );
};
