/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataSourceOption } from './data_source_menu/types';

export const LocalCluster: DataSourceOption = {
  label: i18n.translate('dataSource.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

export const NO_DATASOURCES_CONNECTED_MESSAGE = 'No data sources connected yet.';
export const CONNECT_DATASOURCES_MESSAGE = 'Connect your data sources to get started.';
export const NO_COMPATIBLE_DATASOURCES_MESSAGE = 'No compatible data sources are available.';
export const ADD_COMPATIBLE_DATASOURCES_MESSAGE = 'Add a compatible data source.';
