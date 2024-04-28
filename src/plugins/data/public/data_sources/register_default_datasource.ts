/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { htmlIdGenerator } from '@elastic/eui';
import { DataPublicPluginStart } from '../types';
import { DataSourceUIGroupType } from './datasource/types';

export const DEFAULT_DATA_SOURCE_TYPE = 'DEFAULT_INDEX_PATTERNS';
export const DEFAULT_DATA_SOURCE_NAME = i18n.translate('data.datasource.type.openSearchDefault', {
  defaultMessage: 'OpenSearch Default',
});
export const DEFAULT_DATA_SOURCE_DISPLAY_NAME = i18n.translate(
  'data.datasource.type.openSearchDefaultDisplayName',
  {
    defaultMessage: 'Index patterns',
  }
);

/**
 * Registers the default data source with the provided data excluding 'ui'.
 * This sets up the default cluster data source with predefined configurations using constants.
 * @param data - Data necessary to configure the data source, except for 'ui'.
 */
export const registerDefaultDataSource = (data: Omit<DataPublicPluginStart, 'ui'>) => {
  // Registrations of index patterns as default data source
  const { dataSourceService, dataSourceFactory } = data.dataSources;
  dataSourceService.registerDataSource(
    dataSourceFactory.getDataSourceInstance(DEFAULT_DATA_SOURCE_TYPE, {
      id: htmlIdGenerator(DEFAULT_DATA_SOURCE_NAME)(DEFAULT_DATA_SOURCE_TYPE),
      name: DEFAULT_DATA_SOURCE_NAME,
      type: DEFAULT_DATA_SOURCE_TYPE,
      metadata: {
        ui: {
          label: DEFAULT_DATA_SOURCE_DISPLAY_NAME, // display name of your data source,
          typeLabel: DEFAULT_DATA_SOURCE_DISPLAY_NAME, // display name of your data source type,
          groupType: DataSourceUIGroupType.defaultOpenSearchDataSource,
          selector: {
            displayDatasetsAsSource: true, // when true, selector UI will render data sets with source by calling getDataSets()
          },
        },
      },
      indexPatterns: data.indexPatterns,
    })
  );
};
