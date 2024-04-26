/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { htmlIdGenerator } from '@elastic/eui';
import { DataPublicPluginStart } from '../types';

export const DEFAULT_DATASOURCE_TYPE = 'DEFAULT_INDEX_PATTERNS';
export const DEFAULT_DATASOURCE_NAME = i18n.translate('data.datasource.type.openSearchDefault', {
  defaultMessage: 'OpenSearch Default',
});

export const registerDefaultDataSource = (data: Omit<DataPublicPluginStart, 'ui'>) => {
  // Registrations of index patterns as default data source
  const { dataSourceService, dataSourceFactory } = data.dataSources;
  dataSourceService.registerDataSource(
    dataSourceFactory.getDataSourceInstance(DEFAULT_DATASOURCE_TYPE, {
      id: htmlIdGenerator('local-cluster')('indices'),
      name: DEFAULT_DATASOURCE_NAME,
      type: DEFAULT_DATASOURCE_TYPE,
      metadata: {
        ui: {
          label: 'Index patterns', // display name of your data source,
          typeLabel: 'Index patterns', // display name of your data source type,
          typeGroup: 'DEFAULT_INDEX_PATTERNS',
          selector: {
            displayDatasetsAsSource: true, // when true, selector UI will render data sets with source by calling getDataSets()
          },
        },
      },
      indexPatterns: data.indexPatterns,
    })
  );
};
