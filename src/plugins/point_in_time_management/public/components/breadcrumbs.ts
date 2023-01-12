/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

export function getListBreadcrumbs() {
  return [
    {
      text: i18n.translate('pitManagement.listBreadcrumb', {
        defaultMessage: 'Point in time',
      }),
      href: `/`,
    },
  ];
}
