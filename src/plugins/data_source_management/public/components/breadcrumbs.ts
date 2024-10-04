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

export function getCreateOpenSearchDataSourceBreadcrumbs(useNewUX: boolean) {
  return [
    ...getCreateBreadcrumbs(),
    {
      text: useNewUX
        ? i18n.translate(
            'dataSourcesManagement.dataSources.createOpenSearchDataSourceBreadcrumbs',
            {
              defaultMessage: 'Connect OpenSearch Cluster',
            }
          )
        : i18n.translate(
            'dataSourcesManagement.legacyUX.dataSources.createOpenSearchDataSourceBreadcrumbs',
            {
              defaultMessage: 'Open Search',
            }
          ),
      href: `/configure/OpenSearch`,
    },
  ];
}

export function getCreateAmazonS3DataSourceBreadcrumbs(useNewUX: boolean) {
  return [
    ...getCreateBreadcrumbs(),
    {
      text: useNewUX
        ? i18n.translate('dataSourcesManagement.dataSources.createAmazonS3DataSourceBreadcrumbs', {
            defaultMessage: 'Connect Amazon S3',
          })
        : i18n.translate(
            'dataSourcesManagement.legacyUX.dataSources.createAmazonS3DataSourceBreadcrumbs',
            {
              defaultMessage: 'Amazon S3',
            }
          ),
      href: `/configure/AmazonS3AWSGlue`,
    },
  ];
}

export function getCreatePrometheusDataSourceBreadcrumbs(useNewUX: boolean) {
  return [
    ...getCreateBreadcrumbs(),
    {
      text: useNewUX
        ? i18n.translate(
            'dataSourcesManagement.dataSources.createPrometheusDataSourceBreadcrumbs',
            {
              defaultMessage: 'Connect Prometheus',
            }
          )
        : i18n.translate(
            'dataSourcesManagement.legacyUX.dataSources.createPrometheusDataSourceBreadcrumbs',
            {
              defaultMessage: 'Prometheus',
            }
          ),
      href: `/configure/Prometheus`,
    },
  ];
}

export function getManageDirectQueryDataSourceBreadcrumbs(directQueryDatasourceName: string) {
  return [
    ...getListBreadcrumbs(),
    {
      text: directQueryDatasourceName,
      href: `/manage/${directQueryDatasourceName}`,
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
