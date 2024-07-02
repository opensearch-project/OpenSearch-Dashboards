/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
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
          <EuiButton
            data-test-subj="workspaceForm-bottomBar-cancelButton"
            onClick={showCancelModal}
          >
            {i18n.translate('workspace.form.bottomBar.cancel', {
              defaultMessage: 'Cancel',
            })}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            type="submit"
            form={formId}
            data-test-subj="workspaceForm-bottomBar-createButton"
          >
            {i18n.translate('workspace.form.bottomBar.createWorkspace', {
              defaultMessage: 'Create workspace',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      {isCancelModalVisible && (
        <WorkspaceCancelModal application={application} closeCancelModal={closeCancelModal} />
      )}
    </>
  );
};
