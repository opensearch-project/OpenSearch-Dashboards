/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiSmallButton,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCommentList,
  EuiCommentProps,
  EuiBadge,
  EuiModalFooter,
} from '@elastic/eui';
import { CoreStart, WorkspaceAttribute } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';

export const showDeleteDetailsModal = (
  selectedWorkspaces: WorkspaceAttribute[],
  failedWorksapces: WorkspaceAttribute[],
  openModal: (
    node: React.ReactNode,
    options?: Parameters<CoreStart['overlays']['openModal']>['1']
  ) => ReturnType<CoreStart['overlays']['openModal']>
) => {
  let updateMessages: EuiCommentProps[] = [
    {
      username: 'Delete Process',
      event: 'started to delete teams',
      type: 'update',
      timelineIcon: 'trash',
    },
  ];
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
            <EuiBadge
              data-test-subj={`delete-details-modal-bager-${isFailed ? 'danger' : 'success'}`}
              color={isFailed ? 'danger' : 'success'}
            >
              {isFailed ? 'fail' : 'success'}
            </EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
      type: isFailed ? 'regular' : 'update',
      children: (
        <EuiText data-test-subj="delete-details-modal-name" size="s">
          <p>{selectedWorkspace.name} </p>
        </EuiText>
      ),
      timelineIcon: isFailed ? 'cross' : 'check',
    });
  }

  updateMessages = [...updateMessages, ...newMessages];

  const modal = openModal(
    <EuiModal style={{ width: 800, minHeight: 400 }} onClose={() => modal.close()}>
      <EuiModalHeader data-test-subj="delete-details-modal-header">
        <EuiModalHeaderTitle data-test-subj="delete-details-modal-title">
          {i18n.translate('workspace.deleteDetails.title', {
            defaultMessage: 'Delete team details',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody data-test-subj="delete-details-modal-body">
        <EuiCommentList data-test-subj="delete-details-modal-list" comments={updateMessages} />
      </EuiModalBody>
      <EuiModalFooter>
        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="delete-details-modal-close-button"
              fill
              color="primary"
              onClick={() => modal.close()}
            >
              {i18n.translate('workspace.deleteDetails.close', {
                defaultMessage: 'Close',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalFooter>
    </EuiModal>
  );
};
