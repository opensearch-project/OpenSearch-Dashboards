/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataSourceAttributes } from '../types';

export function getListBreadcrumbs() {
  return [
    {
      text: i18n.translate('dataSourcesManagement.dataSources.listBreadcrumb', {
        defaultMessage: 'Data sources',
      }),
      href: `/`,
    },
  ];
}

export function getCreateBreadcrumbs() {
  return [
    ...getListBreadcrumbs(),
    {
      text: i18n.translate('dataSourcesManagement.dataSources.createBreadcrumb', {
        defaultMessage: 'Create data source',
      }),
      href: `/create`,
    },
  ];
}

export function getEditBreadcrumbs(dataSource: DataSourceAttributes) {
  return [
    ...getListBreadcrumbs(),
    {
      text: dataSource.title,
      href: `/${dataSource.id}`,
    },
  ];
}
