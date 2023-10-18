/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataPublicPluginStart } from '../types';
import { DefaultDslDataSource } from './default_datasource';

export const DEFAULT_DATASOURCE_TYPE = 'DEFAULT_INDEX_PATTERNS';
export const DEFAULT_DATASOURCE_NAME = i18n.translate('data.datasource.type.openSearchDefault', {
  defaultMessage: 'OpenSearch Default',
});

export const registerDefaultDatasource = (data: Omit<DataPublicPluginStart, 'ui'>) => {
  // Datasources registrations for index patterns datasource
  const { dataSourceService, dataSourceFactory } = data.dataSources;
  dataSourceFactory.registerDataSourceType(DEFAULT_DATASOURCE_TYPE, DefaultDslDataSource);
  dataSourceService.registerDataSource(
    dataSourceFactory.getDataSourceInstance(DEFAULT_DATASOURCE_TYPE, {
      name: DEFAULT_DATASOURCE_NAME,
      type: DEFAULT_DATASOURCE_TYPE,
      metadata: null,
      indexPatterns: data.indexPatterns,
    })
  );
};
