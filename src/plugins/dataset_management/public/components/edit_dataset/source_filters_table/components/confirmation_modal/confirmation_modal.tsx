/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import PropTypes from 'prop-types';

import { FormattedMessage } from '@osd/i18n/react';
import { EuiConfirmModal, EUI_MODAL_CONFIRM_BUTTON } from '@elastic/eui';

interface DeleteFilterConfirmationModalProps {
  filterToDeleteValue: string;
  onCancelConfirmationModal: (
    event?: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => void;
  onDeleteFilter: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isSaving: boolean;
}

export const DeleteFilterConfirmationModal = ({
  filterToDeleteValue,
  onCancelConfirmationModal,
  onDeleteFilter,
  isSaving,
}: DeleteFilterConfirmationModalProps) => {
  return (
    <EuiConfirmModal
      title={
        <FormattedMessage
          id="datasetManagement.editDataset.source.deleteSourceFilterLabel"
          defaultMessage="Delete source filter '{value}'?"
          values={{
            value: filterToDeleteValue,
          }}
        />
      }
      onCancel={onCancelConfirmationModal}
      onConfirm={onDeleteFilter}
      cancelButtonText={
        <FormattedMessage
          id="datasetManagement.editDataset.source.deleteFilter.cancelButtonLabel"
          defaultMessage="Cancel"
        />
      }
      buttonColor="danger"
      confirmButtonText={
        <FormattedMessage
          id="datasetManagement.editDataset.source.deleteFilter.deleteButtonLabel"
          defaultMessage="Delete"
        />
      }
      confirmButtonDisabled={isSaving}
      defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}
    />
  );
};

DeleteFilterConfirmationModal.propTypes = {
  filterToDeleteValue: PropTypes.string.isRequired,
  onCancelConfirmationModal: PropTypes.func.isRequired,
  onDeleteFilter: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
};
