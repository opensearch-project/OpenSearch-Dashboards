/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/server';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { getDataSourceEnabled } from './services';
import { OpenSearchFunctionConfig } from '../types';
import { throwError } from '../../../data/server';
import { UNSUPPORTED_ENGINE_TYPES } from '../../../data/common';

export const fetchDataSourceIdByName = async (
  config: OpenSearchFunctionConfig,
  client: SavedObjectsClientContract
) => {
  if (!config.data_source_name) {
    return undefined;
  }

  if (!getDataSourceEnabled().enabled) {
    throw new Error(
      'data_source_name is not supported. Contact your administrator to start using multiple data sources'
    );
  }

  const dataSources = await client.find<DataSourceAttributes>({
    type: 'data-source',
    perPage: 100,
    search: `"${config.data_source_name}"`,
    searchFields: ['title'],
    fields: ['id', 'title', 'dataSourceEngineType'],
  });

  const possibleDataSourceIds = dataSources.saved_objects.filter(
    (obj) => obj.attributes.title === config.data_source_name
  );

  if (possibleDataSourceIds.length !== 1) {
    throw new Error(
      `Expected exactly 1 result for data_source_name "${config.data_source_name}" but got ${possibleDataSourceIds.length} results`
    );
  }

  const dataSource = possibleDataSourceIds[0];

  // Check if the data source uses AnalyticEngine
  if (
    !!dataSource?.attributes?.dataSourceEngineType &&
    UNSUPPORTED_ENGINE_TYPES.includes(dataSource.attributes.dataSourceEngineType)
  ) {
    throwError();
  }

  return dataSource.id;
};
