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
} from '@elastic/eui';
import { UpdatePasswordFormType } from '../../../../types';
import {
  defaultPasswordValidationByField,
  UpdatePasswordValidation,
  validateUpdatePassword,
} from '../../../validation';
import { confirmNewPasswordText, newPasswordText, oldPasswordText } from '../../../text_content';

export interface UpdatePasswordModalProps {
  handleUpdatePassword: (passwords: UpdatePasswordFormType) => void;
  closeUpdatePasswordModal: () => void;
}

export const UpdatePasswordModal = ({
  handleUpdatePassword,
  closeUpdatePasswordModal,
}: UpdatePasswordModalProps) => {
  /* State Variables */
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formErrorsByField, setFormErrorsByField] = useState<UpdatePasswordValidation>(
    defaultPasswordValidationByField
  );
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  const getFormValues = useCallback(() => {
    return {
      oldPassword,
      newPassword,
      confirmNewPassword,
    };
  }, [oldPassword, newPassword, confirmNewPassword]);

  const onClickUpdatePassword = () => {
    if (isFormValid()) {
      handleUpdatePassword(getFormValues());
    }
  };

  /* Validations */
  const isFormValid = useCallback(() => {
    const { formValidationErrors, formValidationErrorsByField } = validateUpdatePassword(
      getFormValues()
    );

    setFormErrors([...formValidationErrors]);
    setFormErrorsByField({ ...formValidationErrorsByField });

    return formValidationErrors.length === 0;
  }, [getFormValues]);

  useEffect(() => {
    if (formErrors.length) {
      isFormValid();
    }
  }, [oldPassword, newPassword, confirmNewPassword, formErrors.length, isFormValid]);

  const renderUpdatePasswordModal = () => {
    return (
      <EuiModal onClose={closeUpdatePasswordModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <h1>Update password</h1>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm
            data-test-subj="data-source-update-password"
            isInvalid={!!formErrors.length}
            error={formErrors}
          >
            <EuiFormRow
              label={oldPasswordText}
              isInvalid={!!formErrorsByField.oldPassword.length}
              error={formErrorsByField.oldPassword}
            >
              <EuiFieldPassword
                placeholder={oldPasswordText}
                type={'dual'}
                value={oldPassword}
                isInvalid={!!formErrorsByField.oldPassword.length}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </EuiFormRow>
            <EuiFormRow
              label={newPasswordText}
              isInvalid={!!formErrorsByField.newPassword.length}
              error={formErrorsByField.newPassword}
            >
              <EuiFieldPassword
                placeholder={newPasswordText}
                type={'dual'}
                value={newPassword}
                isInvalid={!!formErrorsByField.newPassword.length}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </EuiFormRow>
            <EuiFormRow
              label={confirmNewPasswordText}
              isInvalid={!!formErrorsByField.confirmNewPassword.length}
              error={formErrorsByField.confirmNewPassword}
            >
              <EuiFieldPassword
                placeholder={confirmNewPasswordText}
                type={'dual'}
                value={confirmNewPassword}
                isInvalid={!!formErrorsByField.confirmNewPassword.length}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
