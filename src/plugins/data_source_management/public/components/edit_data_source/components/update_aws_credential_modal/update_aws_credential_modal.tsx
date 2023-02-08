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

export interface UpdateAwsCredentialModalProps {
  region: string;
  handleUpdateAwsCredential: (accessKey: string, secretKey: string) => void;
  closeUpdateAwsCredentialModal: () => void;
}

export const UpdateAwsCredentialModal = ({
  region,
  handleUpdateAwsCredential,
  closeUpdateAwsCredentialModal,
}: UpdateAwsCredentialModalProps) => {
  /* State Variables */
  const [newAccessKey, setNewAccessKey] = useState<string>('');
  const [confirmNewAccessKey, setConfirmNewAccessKey] = useState<string>('');
  const [isNewAccessKeyValid, setIsNewAccessKeyValid] = useState<boolean>(true);
  const [isConfirmNewAccessKeyValid, setIsConfirmNewAccessKeyValid] = useState<string[]>([]);

  const [newSecretKey, setNewSecretKey] = useState<string>('');
  const [confirmNewSecretKey, setConfirmNewSecretKey] = useState<string>('');
  const [isNewSecretKeyValid, setIsNewSecretKeyValid] = useState<boolean>(true);
  const [isConfirmNewSecretKeyValid, setIsConfirmNewSecretKeyValid] = useState<string[]>([]);

  const onClickUpdateAwsCredential = () => {
    if (isFormValid()) {
      handleUpdateAwsCredential(newAccessKey, newSecretKey);
    }
  };

  const isFormValid = () => {
    return !!(
      newAccessKey &&
      confirmNewAccessKey &&
      newSecretKey &&
      confirmNewSecretKey &&
      confirmNewAccessKey === newAccessKey &&
      confirmNewSecretKey === newSecretKey
    );
  };

  const validateNewAccessKey = () => {
    setIsNewAccessKeyValid(!!newAccessKey);
  };

  const validateNewSecretKey = () => {
    setIsNewSecretKeyValid(!!newSecretKey);
  };

  const validateConfirmNewAccessKey = () => {
    const invalidReason: string[] = [];
    if (!confirmNewAccessKey) {
      invalidReason.push('');
    } else if (confirmNewAccessKey !== newAccessKey) {
      invalidReason.push(
        i18n.translate('dataSourcesManagement.editDataSource.accessKeyNoMatch', {
          defaultMessage: 'Access keys do not match',
        })
      );
    }
    setIsConfirmNewAccessKeyValid(invalidReason);
  };

  const validateConfirmNewSecretKey = () => {
    const invalidReason: string[] = [];
    if (!confirmNewSecretKey) {
      invalidReason.push('');
    } else if (confirmNewSecretKey !== newSecretKey) {
      invalidReason.push(
        i18n.translate('dataSourcesManagement.editDataSource.secretKeyNoMatch', {
          defaultMessage: 'Secret keys do not match',
        })
      );
    }
    setIsConfirmNewSecretKeyValid(invalidReason);
  };

  const renderUpdateAwsCredentialModal = () => {
    return (
      <EuiModal onClose={closeUpdateAwsCredentialModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <h1>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.updateStoredAwsCredential"
                  defaultMessage="Update stored AWS credential"
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
                  id="dataSourcesManagement.editDataSource.updateStoredAwsCredentialDescription"
                  defaultMessage="Update access key and secret key to reflect accurate aws credential to gain access to the endpoint."
                />
              }
            </EuiText>
          </EuiFormRow>
          <EuiSpacer size="m" />

          <EuiForm data-test-subj="data-source-update-aws-credential">
            {/* Region */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.region', {
                defaultMessage: 'Region',
              })}
            >
              <EuiText size="s" data-test-subj="data-source-update-credential-region">
                {region}
              </EuiText>
            </EuiFormRow>

            {/* updated access key */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.newAccessKey', {
                defaultMessage: 'Updated access key',
              })}
              isInvalid={!isNewAccessKeyValid}
            >
              <EuiFieldPassword
                name="updatedAccessKey"
                data-test-subj="updateStoredAwsCredentialUpdatedAccessKeyField"
                placeholder={i18n.translate(
                  'dataSourcesManagement.editDataSource.newAccessKeyPlaceHolder',
                  {
                    defaultMessage: 'Updated access Key',
                  }
                )}
                type={'dual'}
                value={newAccessKey}
                isInvalid={!isNewAccessKeyValid}
                spellCheck={false}
                onChange={(e) => setNewAccessKey(e.target.value)}
                onBlur={validateNewAccessKey}
              />
            </EuiFormRow>
            {/* Access Key */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.confirmNewAccessKey', {
                defaultMessage: 'Updated access key',
              })}
              isInvalid={!!isConfirmNewAccessKeyValid.length}
              error={isConfirmNewAccessKeyValid}
            >
              <EuiFieldPassword
                name="confirmUpdatedAccessKey"
                data-test-subj="updateStoredAwsCredentialConfirmUpdatedAccessKeyField"
                placeholder={i18n.translate(
                  'dataSourcesManagement.editDataSource.confirmNewAccessKeyPlaceHolder',
                  {
                    defaultMessage: 'Confirm Updated Access Key',
                  }
                )}
                type={'dual'}
                value={confirmNewAccessKey}
                isInvalid={!!isConfirmNewAccessKeyValid.length}
                spellCheck={false}
                onChange={(e) => setConfirmNewAccessKey(e.target.value)}
                onBlur={validateConfirmNewAccessKey}
              />
            </EuiFormRow>

            {/* updated secret key */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.newSecretKey', {
                defaultMessage: 'Updated secret key',
              })}
              isInvalid={!isNewSecretKeyValid}
            >
              <EuiFieldPassword
                name="updatedSecretKey"
                data-test-subj="updateStoredAwsCredentialUpdatedSecretKeyField"
                placeholder={i18n.translate(
                  'dataSourcesManagement.editDataSource.newSecretKeyPlaceHolder',
                  {
                    defaultMessage: 'Updated secret leu',
                  }
                )}
                type={'dual'}
                value={newSecretKey}
                isInvalid={!isNewSecretKeyValid}
                spellCheck={false}
                onChange={(e) => setNewSecretKey(e.target.value)}
                onBlur={validateNewSecretKey}
              />
            </EuiFormRow>
            {/* Secret Key */}
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.editDataSource.confirmNewSecretKey', {
                defaultMessage: 'Confirm updated secret key',
              })}
              isInvalid={!!isConfirmNewSecretKeyValid.length}
              error={isConfirmNewSecretKeyValid}
            >
              <EuiFieldPassword
                name="confirmUpdatedSecretKey"
                data-test-subj="updateStoredAwsCredentialConfirmUpdatedSecretKeyField"
                placeholder={i18n.translate(
                  'dataSourcesManagement.editDataSource.confirmNewSecretKeyPlaceHolder',
                  {
                    defaultMessage: 'Confirm updated secret key ',
                  }
                )}
                type={'dual'}
                value={confirmNewSecretKey}
                isInvalid={!!isConfirmNewSecretKeyValid.length}
                spellCheck={false}
                onChange={(e) => setConfirmNewSecretKey(e.target.value)}
                onBlur={validateConfirmNewSecretKey}
              />
            </EuiFormRow>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty
            data-test-subj="updateStoredAwsCredentialCancelBtn"
            onClick={closeUpdateAwsCredentialModal}
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
            data-test-subj="updateStoredAwsCredentialConfirmBtn"
            onClick={onClickUpdateAwsCredential}
            fill={isFormValid()}
            disabled={!isFormValid()}
          >
            {i18n.translate('dataSourcesManagement.editDataSource.updateStoredAwsCredential', {
              defaultMessage: 'Update stored aws credential',
            })}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  };

  /* Return the modal */
  return <div> {renderUpdateAwsCredentialModal()} </div>;
};
