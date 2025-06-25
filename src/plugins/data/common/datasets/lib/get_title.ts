/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { SavedObjectsClientContract, SimpleSavedObject } from '../../../../../core/public';
import { concatDataSourceWithDataset, getDatasetTitle, getDataSourceReference } from '../utils';

export async function getTitle(
  client: SavedObjectsClientContract,
  datasetId: string,
  dataSourceIdToTitle: Map<string, string>
): Promise<string> {
  const savedObject = (await client.get('dataset', datasetId)) as SimpleSavedObject<any>;

  if (savedObject.error) {
    throw new Error(`Unable to get dataset title: ${savedObject.error.message}`);
  }

  const dataSourceReference = getDataSourceReference(savedObject.references);

  if (dataSourceReference) {
    const dataSourceId = dataSourceReference.id;
    if (dataSourceIdToTitle.has(dataSourceId)) {
      return concatDataSourceWithDataset(
        dataSourceIdToTitle.get(dataSourceId)!,
        savedObject.attributes.title
      );
    }
  }

  const getDataSource = async (id: string) =>
    await client.get<DataSourceAttributes>('data-source', id);

  return getDatasetTitle(savedObject.attributes.title, savedObject.references, getDataSource);
}
