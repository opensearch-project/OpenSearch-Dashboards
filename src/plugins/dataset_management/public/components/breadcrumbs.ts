/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataView } from '../../../data/public';

export function getListBreadcrumbs(currentWorkspaceName?: string) {
  return [
    {
      text: currentWorkspaceName
        ? i18n.translate('datasetManagement.inWorkspace.indexPatterns.listBreadcrumb', {
            defaultMessage: 'Workspace index patterns',
          })
        : i18n.translate('datasetManagement.indexPatterns.listBreadcrumb', {
            defaultMessage: 'Index patterns',
          }),
      href: `/`,
    },
  ];
}

export function getCreateBreadcrumbs() {
  return [
    ...getListBreadcrumbs(),
    {
      text: i18n.translate('datasetManagement.indexPatterns.createBreadcrumb', {
        defaultMessage: 'Create index pattern',
      }),
      href: `/create`,
    },
  ];
}

export function getEditBreadcrumbs(dataset: DataView) {
  return [
    ...getListBreadcrumbs(),
    {
      text: dataset.title,
      href: `/patterns/${dataset.id}`,
    },
  ];
}

export function getEditFieldBreadcrumbs(dataset: DataView, fieldName: string) {
  return [
    ...getEditBreadcrumbs(dataset),
    {
      text: fieldName,
    },
  ];
}

export function getCreateFieldBreadcrumbs(dataset: DataView) {
  return [
    ...getEditBreadcrumbs(dataset),
    {
      text: i18n.translate('datasetManagement.indexPatterns.createFieldBreadcrumb', {
        defaultMessage: 'Create field',
      }),
    },
  ];
}
