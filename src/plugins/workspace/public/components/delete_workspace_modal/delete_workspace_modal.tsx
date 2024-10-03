/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCompressedFieldText,
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
  selectedWorkspaces?: WorkspaceAttribute[];
  onDeleteSuccess?: () => void;
  typeTextToConfirm?: string;
}

export function DeleteWorkspaceModal(props: DeleteWorkspaceModalProps) {
  const typeTextToConfirm = props.typeTextToConfirm ?? 'delete';
  const [value, setValue] = useState('');
  const { onClose, selectedWorkspaces, onDeleteSuccess } = props;
  const {
    services: { notifications, workspaceClient },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();

  const deleteWorkspaces = async () => {
    if (selectedWorkspaces && selectedWorkspaces.length > 0) {
      selectedWorkspaces.forEach(async (selectedWorkspace) => {
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
      });
    }
  };

  return (
    <EuiModal onClose={onClose} className="delete-workspace-modal" aria-label="modal">
      <EuiModalHeader data-test-subj="delete-workspace-modal-header">
        <EuiModalHeaderTitle>Delete workspace</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody data-test-subj="delete-workspace-modal-body">
        {selectedWorkspaces && selectedWorkspaces.length > 0 ? (
          <div style={{ lineHeight: 1.5 }}>
            <p>
              The following workspace will be permanently deleted. This action cannot be undone.
            </p>
            <ul style={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
              {selectedWorkspaces.map((selectedWorkspace) => {
                return selectedWorkspace?.name ? (
                  <li key={selectedWorkspace.id}>{selectedWorkspace.name}</li>
                ) : null;
              })}
            </ul>
            <EuiSpacer />
            <EuiText color="subdued">
              To confirm your action, type <b>{typeTextToConfirm}</b>.
            </EuiText>
            <EuiCompressedFieldText
              placeholder={typeTextToConfirm}
              fullWidth
              value={value}
              data-test-subj="delete-workspace-modal-input"
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        ) : null}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty
          onClick={onClose}
          data-test-subj="delete-workspace-modal-cancel-button"
        >
          Cancel
        </EuiSmallButtonEmpty>
        <EuiSmallButton
          data-test-subj="delete-workspace-modal-confirm"
          onClick={deleteWorkspaces}
          fill
          color="danger"
          disabled={value !== typeTextToConfirm}
        >
          Delete
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
}
