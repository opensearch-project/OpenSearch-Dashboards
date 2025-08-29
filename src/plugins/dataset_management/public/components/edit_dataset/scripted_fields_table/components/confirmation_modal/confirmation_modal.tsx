/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { i18n } from '@osd/i18n';
import { EUI_MODAL_CONFIRM_BUTTON, EuiConfirmModal } from '@elastic/eui';

import { ScriptedFieldItem } from '../../types';

interface DeleteScritpedFieldConfirmationModalProps {
  field: ScriptedFieldItem;
  hideDeleteConfirmationModal: (
    event?: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => void;
  deleteField: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const DeleteScritpedFieldConfirmationModal = ({
  field,
  hideDeleteConfirmationModal,
  deleteField,
}: DeleteScritpedFieldConfirmationModalProps) => {
  const title = i18n.translate('datasetManagement.editDataset.scripted.deleteFieldLabel', {
    defaultMessage: "Delete scripted field '{fieldName}'?",
    values: { fieldName: field.name },
  });
  const cancelButtonText = i18n.translate(
    'datasetManagement.editDataset.scripted.deleteField.cancelButton',
    { defaultMessage: 'Cancel' }
  );
  const confirmButtonText = i18n.translate(
    'datasetManagement.editDataset.scripted.deleteField.deleteButton',
    { defaultMessage: 'Delete' }
  );

  return (
    <EuiConfirmModal
      title={title}
      onCancel={hideDeleteConfirmationModal}
      onConfirm={deleteField}
      cancelButtonText={cancelButtonText}
      confirmButtonText={confirmButtonText}
      defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}
    />
  );
};
