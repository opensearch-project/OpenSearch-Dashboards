/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSmallButtonEmpty,
  EuiHorizontalRule,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState, useCallback } from 'react';
import type { ApplicationStart } from 'opensearch-dashboards/public';
import { WorkspaceFormDataState, WorkspaceCancelModal } from '../workspace_form';
import {
  MAX_WORKSPACE_DESCRIPTION_LENGTH,
  MAX_WORKSPACE_NAME_LENGTH,
} from '../../../common/constants';

interface WorkspaceCreateActionPanelProps {
  formId: string;
  formData: Pick<WorkspaceFormDataState, 'name' | 'description' | 'selectedDataSourceConnections'>;
  application: ApplicationStart;
  isSubmitting: boolean;
  dataSourceEnabled: boolean;
}

export const WorkspaceCreateActionPanel = ({
  formId,
  formData,
  application,
  isSubmitting,
  dataSourceEnabled,
}: WorkspaceCreateActionPanelProps) => {
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const closeCancelModal = useCallback(() => setIsCancelModalVisible(false), []);
  const showCancelModal = useCallback(() => setIsCancelModalVisible(true), []);
  const createButtonDisabled =
    (formData.name?.length ?? 0) > MAX_WORKSPACE_NAME_LENGTH ||
    (formData.description?.length ?? 0) > MAX_WORKSPACE_DESCRIPTION_LENGTH ||
    (dataSourceEnabled && formData.selectedDataSourceConnections.length === 0);

  return (
    <>
      <EuiHorizontalRule margin="s" />
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiSmallButtonEmpty
            data-test-subj="workspaceForm-bottomBar-cancelButton"
            onClick={showCancelModal}
            disabled={isSubmitting}
            iconType="cross"
            flush="left"
          >
            {i18n.translate('workspace.form.right.sidebar.buttons.cancelText', {
              defaultMessage: 'Cancel',
            })}
          </EuiSmallButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            type="submit"
            form={formId}
            data-test-subj="workspaceForm-bottomBar-createButton"
            fill
            disabled={createButtonDisabled || isSubmitting}
            isLoading={isSubmitting}
          >
            {i18n.translate('workspace.form.right.sidebar.buttons.createWorkspaceText', {
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
