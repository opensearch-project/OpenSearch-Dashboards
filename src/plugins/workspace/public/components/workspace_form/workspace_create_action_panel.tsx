/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiSmallButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState, useCallback } from 'react';
import type { ApplicationStart } from 'opensearch-dashboards/public';
import type { WorkspaceFormData } from './types';
import { WorkspaceCancelModal } from './workspace_cancel_modal';
import {
  MAX_WORKSPACE_DESCRIPTION_LENGTH,
  MAX_WORKSPACE_NAME_LENGTH,
} from '../../../common/constants';

interface WorkspaceCreateActionPanelProps {
  formId: string;
  formData: Partial<Pick<WorkspaceFormData, 'name' | 'description'>>;
  application: ApplicationStart;
}

export const WorkspaceCreateActionPanel = ({
  formId,
  formData,
  application,
}: WorkspaceCreateActionPanelProps) => {
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const closeCancelModal = useCallback(() => setIsCancelModalVisible(false), []);
  const showCancelModal = useCallback(() => setIsCancelModalVisible(true), []);
  const createButtonDisabled =
    (formData.name?.length ?? 0) > MAX_WORKSPACE_NAME_LENGTH ||
    (formData.description?.length ?? 0) > MAX_WORKSPACE_DESCRIPTION_LENGTH;

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
            disabled={createButtonDisabled}
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
