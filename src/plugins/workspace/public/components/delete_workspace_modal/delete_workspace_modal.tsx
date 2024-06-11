/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { WorkspaceAttribute } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceClient } from '../../workspace_client';

export interface DeleteWorkspaceModalProps {
  onClose: () => void;
  selectedWorkspace?: WorkspaceAttribute | null;
  onDeleteSuccess?: () => void;
}

export function DeleteWorkspaceModal(props: DeleteWorkspaceModalProps) {
  const [value, setValue] = useState('');
  const { onClose, selectedWorkspace, onDeleteSuccess } = props;
  const {
    services: { notifications, workspaceClient },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();

  const deleteWorkspace = async () => {
    if (selectedWorkspace?.id) {
      let result;
      try {
        result = await workspaceClient.delete(selectedWorkspace?.id);
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.delete.failed', {
            defaultMessage: 'Failed to delete workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return onClose();
      }
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.delete.success', {
            defaultMessage: 'Delete workspace successfully',
          }),
        });
        onClose();
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.delete.failed', {
            defaultMessage: 'Failed to delete workspace',
          }),
          text: result?.error,
        });
      }
    }
  };

  return (
    <EuiModal onClose={onClose} className="delete-workspace-modal" aria-label="modal">
      <EuiModalHeader data-test-subj="delete-workspace-modal-header">
        <EuiModalHeaderTitle>Delete workspace</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody data-test-subj="delete-workspace-modal-body">
        <div style={{ lineHeight: 1.5 }}>
          <p>The following workspace will be permanently deleted. This action cannot be undone.</p>
          <ul style={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
            {selectedWorkspace?.name ? <li>{selectedWorkspace.name}</li> : null}
          </ul>
          <EuiSpacer />
          <EuiText color="subdued">
            To confirm your action, type <b>delete</b>.
          </EuiText>
          <EuiFieldText
            placeholder="delete"
            fullWidth
            value={value}
            data-test-subj="delete-workspace-modal-input"
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose} data-test-subj="delete-workspace-modal-cancel-button">
          Cancel
        </EuiButtonEmpty>
        <EuiButton
          data-test-subj="delete-workspace-modal-confirm"
          onClick={deleteWorkspace}
          fill
          color="danger"
          disabled={value !== 'delete'}
        >
          Delete
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
}
