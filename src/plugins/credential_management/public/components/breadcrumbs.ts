/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EditCredentialItem } from './types';

export function getListBreadcrumbs() {
  return [
    {
      text: i18n.translate('credentialManagement.credentials.listBreadcrumb', {
        defaultMessage: 'Credentials',
      }),
      href: `/`,
    },
  ];
}

export function getCreateBreadcrumbs() {
  return [
    ...getListBreadcrumbs(),
    {
      text: i18n.translate('credentialManagement.credentials.createBreadcrumb', {
        defaultMessage: 'Create Stored Credential',
      }),
      href: `/create`,
    },
  ];
}

export function getEditBreadcrumbs(credential: EditCredentialItem) {
  return [
    ...getListBreadcrumbs(),
    {
      text: credential.title,
      href: `/${credential.id}`,
    },
  ];
}
