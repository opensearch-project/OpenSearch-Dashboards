/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import type { DataViewSavedObjectAttrs } from './data_views';
import type {
  SavedObject,
  DataViewSavedObjectReference,
  DataViewSavedObjectsClientCommon,
} from '../types';

/**
 * Returns an object matching a given title
 *
 * @param client {DataViewSavedObjectsClientCommon}
 * @param title {string}
 * @param dataSourceId {string}{optional}
 * @returns {Promise<SavedObject|undefined>}
 */
export async function findByTitle(
  client: DataViewSavedObjectsClientCommon,
  title: string,
  dataSourceId?: string
) {
  if (title) {
    const savedObjects = (
      await client.find<DataViewSavedObjectAttrs>({
        type: 'index-pattern',
        perPage: 10,
        search: `"${title}"`,
        searchFields: ['title'],
        fields: ['title'],
      })
    ).filter((obj) => {
      return obj && obj.attributes && validateDataViewDataSourceReference(obj, dataSourceId);
    });

    return savedObjects.find((obj) => obj.attributes.title.toLowerCase() === title.toLowerCase());
  }
}

// This is used to validate datasource reference of index pattern
export const validateDataViewDataSourceReference = (
  dataView: SavedObject<DataViewSavedObjectAttrs>,
  dataSourceId?: string
) => {
  const references = dataView.references;
  if (dataSourceId) {
    return references.some((ref) => ref.id === dataSourceId && ref.type === 'data-source');
  } else {
    // No datasource id passed as input meaning we are getting index pattern from default cluster,
    // and it's supposed to be an empty array
    return references.length === 0;
  }
};

export const getDataViewTitle = async (
  dataViewTitle: string,
  references: DataViewSavedObjectReference[],
  getDataSource: (id: string) => Promise<SavedObject<DataSourceAttributes>>
): Promise<string> => {
  let dataSourceTitle;
  const dataSourceReference = getDataSourceReference(references);

  // If an index-pattern references datasource, prepend data source name with index pattern name for display purpose
  if (dataSourceReference) {
    const dataSourceId = dataSourceReference.id;
    try {
      const {
        attributes: { title },
        error,
      } = await getDataSource(dataSourceId);
      dataSourceTitle = error ? dataSourceId : title;
    } catch (e) {
      // use datasource id as title when failing to fetch datasource
      dataSourceTitle = dataSourceId;
    }
    return concatDataSourceWithDataView(dataSourceTitle, dataViewTitle);
  } else {
    // if index pattern doesn't reference datasource, return as it is.
    return dataViewTitle;
  }
};

export const concatDataSourceWithDataView = (dataSourceTitle: string, dataViewTitle: string) => {
  const DATA_SOURCE_INDEX_PATTERN_DELIMITER = '::';

  return dataSourceTitle.concat(DATA_SOURCE_INDEX_PATTERN_DELIMITER).concat(dataViewTitle);
};

export const getDataSourceReference = (references: DataViewSavedObjectReference[]) => {
  return references.find((ref) => ref.type === 'data-source');
};
