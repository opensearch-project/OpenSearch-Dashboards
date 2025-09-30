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
} from '@elastic/eui';
import { CoreStart, WorkspaceAttribute } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import {
  toMountPoint,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { WorkspaceClient } from '../../workspace_client';
import { showDeleteDetailsModal } from './show_delete_details_modal';

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

  const deleteWorkspaces = async () => {
    if (deleting) return;
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
            defaultMessage: 'Failed to delete team',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        setDeleting(false);
        return onClose();
      }

      if (result?.fail === 0) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.delete.success', {
            defaultMessage: '{successCount} teams deleted successfully',
            values: {
              successCount: result.success,
            },
          }),
          text: toMountPoint(
            <>
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton
                    color="success"
                    onClick={() =>
                      showDeleteDetailsModal(selectedWorkspaces, failedWorksapces, openModal)
                    }
                  >
                    {i18n.translate('workspace.delete.detail', {
                      defaultMessage: 'View Delete Details',
                    })}
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          ),
        });
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        const isAllFailed = result?.success === 0;

        notifications?.toasts[isAllFailed ? 'addDanger' : 'addWarning']({
          title: isAllFailed
            ? i18n.translate('workspace.delete.allFailed', {
                defaultMessage: '{failCount} teams failed to delete',
                values: {
                  failCount: result.fail,
                },
              })
            : i18n.translate('workspace.delete.warning', {
                defaultMessage:
                  '{successCount} teams deleted successfully, {failCount} failed to delete',
                values: {
                  failCount: result.fail,
                  successCount: result.success,
                },
              }),
          text: toMountPoint(
            <>
              <div>
                {i18n.translate('workspace.delete.failed.name', {
                  defaultMessage: 'Failed team name ',
                })}
                {failedWorksapces.map((selectedWorkspace) => selectedWorkspace.name).join(', ')}{' '}
              </div>
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton
                    color={isAllFailed ? 'danger' : 'warning'}
                    onClick={() =>
                      showDeleteDetailsModal(selectedWorkspaces, failedWorksapces, openModal)
                    }
                  >
                    {i18n.translate('workspace.delete.detail', {
                      defaultMessage: 'View Delete Details',
                    })}
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
        <EuiModalHeaderTitle>
          {i18n.translate('workspace.delete.title', {
            defaultMessage: 'Delete team',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody data-test-subj="delete-workspace-modal-body">
        {selectedWorkspaces && selectedWorkspaces.length > 0 ? (
          <div style={{ lineHeight: 1.5 }}>
            <p>
              {i18n.translate('workspace.delete.note', {
                defaultMessage:
                  'The following workspace will be permanently deleted. This action cannot be undone.',
              })}
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
          {i18n.translate('workspace.delete.cancel.button', {
            defaultMessage: 'Cancel',
          })}
        </EuiSmallButtonEmpty>
        <EuiSmallButton
          data-test-subj="delete-workspace-modal-confirm"
          onClick={deleteWorkspaces}
          fill
          color="danger"
          disabled={value !== typeTextToConfirm}
          isLoading={deleting}
        >
          {i18n.translate('workspace.delete.confirm.button', {
            defaultMessage: 'Delete',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
}
