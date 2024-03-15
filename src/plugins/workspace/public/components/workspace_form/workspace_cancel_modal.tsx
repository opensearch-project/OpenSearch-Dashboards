/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiConfirmModal } from '@elastic/eui';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { WORKSPACE_LIST_APP_ID } from '../../../common/constants';

interface WorkspaceCancelModalProps {
  visible: boolean;
  application: ApplicationStart;
  closeCancelModal: () => void;
}

export const WorkspaceCancelModal = ({
  application,
  visible,
  closeCancelModal,
}: WorkspaceCancelModalProps) => {
  if (!visible) {
    return null;
  }

  return (
    <EuiConfirmModal
      data-test-subj="workspaceForm-cancelModal"
      title={i18n.translate('workspace.form.cancelModal.title', {
        defaultMessage: 'Discard changes?',
      })}
      onCancel={closeCancelModal}
      onConfirm={() => application?.navigateToApp(WORKSPACE_LIST_APP_ID)}
      cancelButtonText={i18n.translate('workspace.form.cancelButtonText.', {
        defaultMessage: 'Continue editing',
      })}
      confirmButtonText={i18n.translate('workspace.form.confirmButtonText.', {
        defaultMessage: 'Discard changes',
      })}
      buttonColor="danger"
      defaultFocusedButton="confirm"
    >
      {i18n.translate('workspace.form.cancelModal.body', {
        defaultMessage: 'This will discard all changes. Are you sure?',
      })}
    </EuiConfirmModal>
  );
};
