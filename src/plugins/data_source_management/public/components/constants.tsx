/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataSourceOption } from './data_source_menu/types';
import { DatasourceType } from '../../framework/types';

export const LocalCluster: DataSourceOption = {
  label: i18n.translate('dataSourcesManagement.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

export { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../../common';

export const OPENSEARCH_DOCUMENTATION_URL =
  'https://opensearch.org/docs/latest/dashboards/management/data-sources/';

export const OPENSEARCH_S3_DOCUMENTATION_URL =
  'https://opensearch.org/docs/latest/dashboards/management/S3-data-source/';

export const OPENSEARCH_ACC_DOCUMENTATION_URL =
  'https://opensearch.org/docs/latest/dashboards/management/accelerate-external-data/';
export const QUERY_RESTRICTED = 'query-restricted';
export const QUERY_ALL = 'query-all';

export const DatasourceTypeToDisplayName: { [key in DatasourceType]: string } = {
  PROMETHEUS: 'Prometheus',
  S3GLUE: 'Amazon S3',
};

export const PrometheusURL = 'Prometheus';
export const AmazonS3URL = 'AmazonS3AWSGlue';

export const UrlToDatasourceType: { [key: string]: DatasourceType } = {
  [PrometheusURL]: 'PROMETHEUS',
  [AmazonS3URL]: 'S3GLUE',
};

export type AuthMethod = 'noauth' | 'basicauth' | 'awssigv4';
