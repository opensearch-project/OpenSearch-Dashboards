/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EUI_MODAL_CONFIRM_BUTTON, EuiConfirmModal } from '@elastic/eui';

export interface OverwriteModalProps {
  onSkip: () => void;
  onConfirm: () => void;
}
export const OverwriteModal = ({ onSkip, onConfirm }: OverwriteModalProps) => {
  return (
    <EuiConfirmModal
      title={i18n.translate('console.overwriteModal.title', {
        defaultMessage: 'Confirm Overwrite',
      })}
      cancelButtonText={i18n.translate('console.overwriteModal.cancelButtonText', {
        defaultMessage: 'Skip',
      })}
      confirmButtonText={i18n.translate('console.overwriteModal.overwriteButtonText', {
        defaultMessage: 'Overwrite',
      })}
      buttonColor="danger"
      onCancel={onSkip}
      onConfirm={onConfirm}
      defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}
      maxWidth="500px"
    >
      <p>
        {i18n.translate('console.overwriteModal.body.conflict', {
          defaultMessage:
            'Are you sure you want to overwrite the existing queries? This action cannot be undone. All existing queries will be deleted and replaced with the imported queries. If you are unsure, please choose the "{option}" option instead',
          values: { option: 'Merge with existing queries' },
        })}
      </p>
    </EuiConfirmModal>
  );
};
