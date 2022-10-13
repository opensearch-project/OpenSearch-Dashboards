/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import {
  CANCEL_TEXT,
  CONFIRM_NEW_PASSWORD_TEXT,
  NEW_PASSWORD_TEXT,
  PASSWORD_NO_MATCH,
  UPDATE_STORED_PASSWORD,
  UPDATE_STORED_PASSWORD_DESCRIPTION,
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
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState<boolean>(true);
  const [isConfirmNewPasswordValid, setIsConfirmNewPasswordValid] = useState<string[]>([]);

  const onClickUpdatePassword = () => {
    if (isFormValid()) {
      handleUpdatePassword(newPassword);
    }
  };

  const isFormValid = () => {
    return !!(newPassword && confirmNewPassword && confirmNewPassword === newPassword);
  };

  const validateNewPassword = () => {
    setIsNewPasswordValid(!!newPassword);
  };

  const validateConfirmNewPassword = () => {
    const invalidReason: string[] = [];
    if (!confirmNewPassword) {
      invalidReason.push('');
    } else if (confirmNewPassword !== newPassword) {
      invalidReason.push(PASSWORD_NO_MATCH);
    }
    setIsConfirmNewPasswordValid(invalidReason);
  };

  const renderUpdatePasswordModal = () => {
    return (
      <EuiModal onClose={closeUpdatePasswordModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <h1>{UPDATE_STORED_PASSWORD}</h1>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow>
            <EuiText size="m" style={{ fontWeight: 300 }}>
              {UPDATE_STORED_PASSWORD_DESCRIPTION}
            </EuiText>
          </EuiFormRow>
          <EuiSpacer size="m" />

          <EuiForm data-test-subj="data-source-update-password">
            {/* Username */}
            <EuiFormRow label={USERNAME}>
              <EuiText size="s" data-test-subj="data-source-update-password-username">
                {username}
              </EuiText>
            </EuiFormRow>
            {/* updated Password */}
            <EuiFormRow label={NEW_PASSWORD_TEXT} isInvalid={!isNewPasswordValid}>
              <EuiFieldPassword
                name="updatedPassword"
                data-test-subj="updateStoredPasswordUpdatedPasswordField"
                placeholder={NEW_PASSWORD_TEXT}
                type={'dual'}
                value={newPassword}
                isInvalid={!isNewPasswordValid}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={validateNewPassword}
              />
            </EuiFormRow>
            {/* Password */}
            <EuiFormRow
              label={CONFIRM_NEW_PASSWORD_TEXT}
              isInvalid={!!isConfirmNewPasswordValid.length}
              error={isConfirmNewPasswordValid}
            >
              <EuiFieldPassword
                name="confirmUpdatedPassword"
                data-test-subj="updateStoredPasswordConfirmUpdatedPasswordField"
                placeholder={CONFIRM_NEW_PASSWORD_TEXT}
                type={'dual'}
                value={confirmNewPassword}
                isInvalid={!!isConfirmNewPasswordValid.length}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onBlur={validateConfirmNewPassword}
              />
            </EuiFormRow>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty
            data-test-subj="updateStoredPasswordCancelBtn"
            onClick={closeUpdatePasswordModal}
          >
            {CANCEL_TEXT}
          </EuiButtonEmpty>
          <EuiButton
            type="submit"
            data-test-subj="updateStoredPasswordConfirmBtn"
            onClick={onClickUpdatePassword}
            fill={isFormValid()}
            disabled={!isFormValid()}
          >
            {UPDATE_STORED_PASSWORD}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  };

  /* Return the modal */
  return <div> {renderUpdatePasswordModal()} </div>;
};
