/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldPassword,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiText,
} from '@elastic/eui';
import {
  DATA_SOURCE_VALIDATION_PASSWORD_EMPTY,
  NEW_PASSWORD_TEXT,
  UPDATE_STORED_PASSWORD,
  USERNAME,
} from '../../../text_content';

export interface UpdatePasswordModalProps {
  username: string;
  handleUpdatePassword: (password: string) => void;
  closeUpdatePasswordModal: () => void;
}

export const UpdatePasswordModal = ({
  username,
  handleUpdatePassword,
  closeUpdatePasswordModal,
}: UpdatePasswordModalProps) => {
  /* State Variables */
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState<string>('');

  const getFormValues = useCallback(() => newPassword, [newPassword]);

  const onClickUpdatePassword = () => {
    if (isFormValid()) {
      handleUpdatePassword(getFormValues());
    }
  };

  /* Validations */
  const isFormValid = useCallback(() => {
    const errors = [];

    if (!newPassword) {
      errors.push(DATA_SOURCE_VALIDATION_PASSWORD_EMPTY);
    }

    setFormErrors([...errors]);

    return formErrors.length === 0;
  }, [formErrors.length, newPassword]);

  useEffect(() => {
    if (formErrors.length) {
      isFormValid();
    }
  }, [newPassword, formErrors.length, isFormValid]);

  const renderUpdatePasswordModal = () => {
    return (
      <EuiModal onClose={closeUpdatePasswordModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <h1>{UPDATE_STORED_PASSWORD}</h1>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm
            data-test-subj="data-source-update-password"
            isInvalid={!!formErrors.length}
            error={formErrors}
          >
            {/* Username */}
            <EuiFormRow label={USERNAME}>
              <EuiText size="s">{username}</EuiText>
            </EuiFormRow>
            {/* Password */}
            <EuiFormRow
              label={NEW_PASSWORD_TEXT}
              isInvalid={!!formErrors.length}
              error={formErrors}
            >
              <EuiFieldPassword
                placeholder={NEW_PASSWORD_TEXT}
                type={'dual'}
                value={newPassword}
                isInvalid={!!formErrors.length}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </EuiFormRow>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={closeUpdatePasswordModal}>Cancel</EuiButtonEmpty>
          <EuiButton type="submit" form="modalFormId" onClick={onClickUpdatePassword} fill>
            Update
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  };

  /* Return the modal */
  return <div> {renderUpdatePasswordModal()} </div>;
};
