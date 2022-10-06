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
  EuiText,
} from '@elastic/eui';
import { NEW_PASSWORD_TEXT, UPDATE_STORED_PASSWORD, USERNAME } from '../../../text_content';

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

  const onClickUpdatePassword = () => {
    if (!!newPassword) {
      handleUpdatePassword(newPassword);
    }
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
          <EuiForm data-test-subj="data-source-update-password">
            {/* Username */}
            <EuiFormRow label={USERNAME}>
              <EuiText size="s">{username}</EuiText>
            </EuiFormRow>
            {/* Password */}
            <EuiFormRow label={NEW_PASSWORD_TEXT}>
              <EuiFieldPassword
                placeholder={NEW_PASSWORD_TEXT}
                type={'dual'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </EuiFormRow>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={closeUpdatePasswordModal}>Cancel</EuiButtonEmpty>
          <EuiButton
            type="submit"
            form="modalFormId"
            onClick={onClickUpdatePassword}
            fill={!!newPassword}
            disabled={!newPassword}
          >
            Update
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  };

  /* Return the modal */
  return <div> {renderUpdatePasswordModal()} </div>;
};
