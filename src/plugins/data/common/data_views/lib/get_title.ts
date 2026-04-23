/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { SavedObjectsClientContract, SimpleSavedObject } from '../../../../../core/public';
import { concatDataSourceWithDataView, getDataViewTitle, getDataSourceReference } from '../utils';

export async function getTitle(
  client: SavedObjectsClientContract,
  dataViewId: string,
  dataSourceIdToTitle: Map<string, string>
): Promise<string> {
  const savedObject = (await client.get('index-pattern', dataViewId)) as SimpleSavedObject<any>;

  if (savedObject.error) {
    throw new Error(`Unable to get index-pattern title: ${savedObject.error.message}`);
  }

  // @ts-expect-error TS2345 TODO(ts-error): fixme
  const dataSourceReference = getDataSourceReference(savedObject.references);

  if (dataSourceReference) {
    const dataSourceId = dataSourceReference.id;
    if (dataSourceIdToTitle.has(dataSourceId)) {
      return concatDataSourceWithDataView(
        dataSourceIdToTitle.get(dataSourceId)!,
        savedObject.attributes.title
      );
    }
  }

  const getDataSource = async (id: string) =>
    await client.get<DataSourceAttributes>('data-source', id);

  // @ts-expect-error TS2345 TODO(ts-error): fixme
  return getDataViewTitle(savedObject.attributes.title, savedObject.references, getDataSource);
}
