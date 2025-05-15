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
} from '@elastic/eui';
import { CoreStart, WorkspaceAttribute } from 'opensearch-dashboards/public';

export const DeleteDetailsModal = (
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
      event: 'started to delete workspaces',
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
