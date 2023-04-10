/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';

export async function getDataSources(savedObjectsClient: SavedObjectsClientContract) {
  return (
    savedObjectsClient
      .find<DataSourceAttributes>({
        type: 'data-source',
        fields: ['title'],
        perPage: 10000,
      })
      .then((response) =>
        response.savedObjects.map((dataSource) => {
          const id = dataSource.id;
          const title = dataSource.get('title');

          return {
            id,
            title,
            sort: `${title}`,
          };
        })
      ) || []
  );
}
