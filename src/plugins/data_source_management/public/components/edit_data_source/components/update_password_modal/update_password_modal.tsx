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
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

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
      invalidReason.push(
        i18n.translate('dataSourcesManagement.editDataSource.passwordNoMatch', {
          defaultMessage: 'Passwords do not match',
        })
      );
    }
    setIsConfirmNewPasswordValid(invalidReason);
  };

  const renderUpdatePasswordModal = () => {
    return (
      <EuiModal onClose={closeUpdatePasswordModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <h1>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.updateStoredPassword"
                  defaultMessage="Update stored password"
                />
              }
            </h1>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFormRow>
            <EuiText size="m" style={{ fontWeight: 300 }}>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.updateStoredPasswordDescription"
                  defaultMessage="Update credential password to reflect accurate password to gain access to the endpoint."
                />
              }
            </EuiText>
          </EuiFormRow>
          <EuiSpacer size="m" />

          <EuiForm data-test-subj="data-source-update-password">
            {/* Username */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.username', {
                defaultMessage: 'Username',
              })}
            >
              <EuiText size="s" data-test-subj="data-source-update-password-username">
                {username}
              </EuiText>
            </EuiFormRow>
            {/* updated Password */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.newPassword', {
                defaultMessage: 'Updated password',
              })}
              isInvalid={!isNewPasswordValid}
            >
              <EuiFieldPassword
                name="updatedPassword"
                data-test-subj="updateStoredPasswordUpdatedPasswordField"
                placeholder={i18n.translate(
                  'dataSourcesManagement.editDataSource.newPasswordPlaceHolder',
                  {
                    defaultMessage: 'Updated password',
                  }
                )}
                type={'dual'}
                value={newPassword}
                isInvalid={!isNewPasswordValid}
                spellCheck={false}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={validateNewPassword}
              />
            </EuiFormRow>
            {/* Password */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.confirmNewPassword', {
                defaultMessage: 'Confirm Updated password',
              })}
              isInvalid={!!isConfirmNewPasswordValid.length}
              error={isConfirmNewPasswordValid}
            >
              <EuiFieldPassword
                name="confirmUpdatedPassword"
                data-test-subj="updateStoredPasswordConfirmUpdatedPasswordField"
                placeholder={i18n.translate(
                  'dataSourcesManagement.editDataSource.confirmNewPasswordPlaceHolder',
                  {
                    defaultMessage: 'Confirm Updated password',
                  }
                )}
                type={'dual'}
                value={confirmNewPassword}
                isInvalid={!!isConfirmNewPasswordValid.length}
                spellCheck={false}
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
            {
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.cancel"
                defaultMessage="Cancel"
              />
            }
          </EuiButtonEmpty>
          <EuiButton
            type="submit"
            data-test-subj="updateStoredPasswordConfirmBtn"
            onClick={onClickUpdatePassword}
            fill={isFormValid()}
            disabled={!isFormValid()}
          >
            {i18n.translate('dataSourcesManagement.editDataSource.updateStoredPassword', {
              defaultMessage: 'Update stored password',
            })}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  };

  /* Return the modal */
  return <div> {renderUpdatePasswordModal()} </div>;
};
