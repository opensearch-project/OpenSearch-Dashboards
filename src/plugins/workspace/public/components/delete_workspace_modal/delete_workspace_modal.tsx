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
  EuiFlexGroup,
  EuiFlexItem,
  EuiCommentList,
  EuiCommentProps,
  EuiBadge,
} from '@elastic/eui';
import { CoreStart, WorkspaceAttribute } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import {
  toMountPoint,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { WorkspaceClient } from '../../workspace_client';

export interface DeleteWorkspaceModalProps {
  onClose: () => void;
  selectedWorkspaces?: WorkspaceAttribute[];
  onDeleteSuccess?: () => void;
  typeTextToConfirm?: string;
  openModal: (
    node: React.ReactNode,
    options?: Parameters<CoreStart['overlays']['openModal']>['1']
  ) => ReturnType<CoreStart['overlays']['openModal']>;
}

export function DeleteWorkspaceModal(props: DeleteWorkspaceModalProps) {
  const typeTextToConfirm = props.typeTextToConfirm ?? 'delete';
  const [value, setValue] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { onClose, selectedWorkspaces, onDeleteSuccess, openModal } = props;
  const {
    services: { notifications, workspaceClient },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();
  let updateMessages: EuiCommentProps[] = [
    {
      username: 'Delete Process',
      event: 'started to delete workspaces',
      type: 'update',
      timelineIcon: 'trash',
    },
  ];

  const showDeleteDetails = (updateMessages: EuiCommentProps[]) => {
    const modal = openModal(
      <EuiModal style={{ width: 800, minHeight: 400 }} onClose={() => modal.close()}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Delete workspace details</EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiCommentList comments={updateMessages} />
          <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiSmallButton fill color="primary" onClick={() => modal.close()}>
                Close
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalBody>
      </EuiModal>
    );
  };

  const deleteWorkspaces = async () => {
    setDeleting(true);
    let result: { success: number; fail: number; failedIds: string[] };
    let failedWorksapces: WorkspaceAttribute[];
    if (selectedWorkspaces && selectedWorkspaces.length > 0) {
      const ids = selectedWorkspaces
        .filter((selectedWorkspace) => selectedWorkspace.id)
        .map((selectedWorkspace) => selectedWorkspace.id);
      try {
        result = await workspaceClient.batchDelete(ids);
        failedWorksapces = selectedWorkspaces.filter((selectedWorkspace) =>
          result?.failedIds.includes(selectedWorkspace.id)
        );
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.delete.failed', {
            defaultMessage: 'Failed to delete workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return onClose();
      }

      const newMessages: EuiCommentProps[] = [];

      for (const selectedWorkspace of selectedWorkspaces) {
        const isFailed = failedWorksapces.some(
          (failedWorkspace) => failedWorkspace.id === selectedWorkspace.id
        );

        newMessages.push({
          username: 'Delete process',
          event: (
            <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiText>started to delete workspace</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color={isFailed ? 'danger' : 'success'}>
                  {isFailed ? 'fail' : 'success'}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          type: isFailed ? 'regular' : 'update',
          children: (
            <EuiText size="s">
              <p>{selectedWorkspace.name} </p>
            </EuiText>
          ),
          timelineIcon: isFailed ? 'cross' : 'check',
        });
      }

      updateMessages = [...updateMessages, ...newMessages];

      if (result?.fail === 0) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.delete.success', {
            defaultMessage: '{successCount} workspaces deleted successfully',
            values: {
              successCount: result.success,
            },
          }),
          text: toMountPoint(
            <>
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton color="success" onClick={() => showDeleteDetails(updateMessages)}>
                    View Delete Details
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          ),
        });
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else if (result?.success === 0) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.delete.failed', {
            defaultMessage: '{failCount} workspaces failed to delete ',
            values: {
              failCount: result.fail,
            },
          }),
          text: toMountPoint(
            <>
              <div>
                Failed workspace name:{' '}
                {failedWorksapces.map((selectedWorkspace) => selectedWorkspace.name).join(', ')}{' '}
              </div>
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton color="danger" onClick={() => showDeleteDetails(updateMessages)}>
                    View Delete Details
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          ),
        });
      } else {
        notifications?.toasts.addWarning({
          title: i18n.translate('workspace.delete.warning', {
            defaultMessage:
              '{successCount} workspaces deleted successfully, {failCount} failed to delete',
            values: {
              successCount: result.success,
              failCount: result.fail,
            },
          }),
          text: toMountPoint(
            <>
              <div>
                Failed workspace name:{' '}
                {failedWorksapces.map((selectedWorkspace) => selectedWorkspace.name).join(', ')}{' '}
              </div>
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton color="warning" onClick={() => showDeleteDetails(updateMessages)}>
                    View Delete Details
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          ),
        });
      }

      setDeleting(false);
      onClose();
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
          isLoading={deleting}
        >
          Delete
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
}
