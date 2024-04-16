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
