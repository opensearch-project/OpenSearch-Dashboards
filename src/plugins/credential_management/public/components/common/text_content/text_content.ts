/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

export const deleteCredentialDescribeMsg = i18n.translate(
  'credentialManagement.textContent.deleteCredentialDescribeMsg',
  {
    defaultMessage:
      'This will also delete their credential materials. All data sources using this credential will be invalid for access, and they must choose new credentials.',
  }
);

export const deleteCredentialConfirmMsg = i18n.translate(
  'credentialManagement.textContent.deleteCredentialConfirmMsg',
  {
    defaultMessage: 'To confirm deletion, click delete button.',
  }
);

export const deleteCredentialWarnMsg = i18n.translate(
  'credentialManagement.textContent.deleteCredentialWarnMsg',
  {
    defaultMessage: 'Note: this action is irrevocable!',
  }
);

export const deleteButtonOnConfirmText = i18n.translate(
  'credentialManagement.textContent.deleteButtonOnConfirmText',
  {
    defaultMessage: 'Delete credential permanently?',
  }
);

export const deleteCredentialButtonDescription = i18n.translate(
  'credentialManagement.textContent.deleteCredentialButtonDescription',
  {
    defaultMessage: 'Remove this credential',
  }
);

export const cancelButtonOnDeleteCancelText = i18n.translate(
  'credentialManagement.textContent.cancelButtonOnDeleteCancelText',
  {
    defaultMessage: 'Cancel',
  }
);

export const confirmButtonOnDeleteComfirmText = i18n.translate(
  'credentialManagement.textContent.confirmButtonOnDeleteComfirmText',
  {
    defaultMessage: 'Delete',
  }
);

export const credentialEditPageAuthType = i18n.translate(
  'credentialManagement.textContent.credentialEditPageAuthType',
  {
    defaultMessage: 'Username & password',
  }
);

export const credentialEditPageAuthTitle = i18n.translate(
  'credentialManagement.textContent.credentialEditPageAuthTitle',
  {
    defaultMessage: 'Authentication Details',
  }
);

export const credentialEditPageInfoTitle = i18n.translate(
  'credentialManagement.textContent.credentialEditPageInfoTitle',
  {
    defaultMessage: 'Saved Credential Information',
  }
);
