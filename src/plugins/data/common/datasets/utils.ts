/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import type { DatasetSavedObjectAttrs } from './datasets';
import type { SavedObject, SavedObjectReference, SavedObjectsClientCommon } from '../types';

/**
 * Returns an object matching a given title
 *
 * @param client {SavedObjectsClientCommon}
 * @param title {string}
 * @param dataSourceId {string}{optional}
 * @returns {Promise<SavedObject|undefined>}
 */
export async function findByTitle(
  client: SavedObjectsClientCommon,
  title: string,
  dataSourceId?: string
) {
  if (title) {
    const savedObjects = (
      await client.find<DatasetSavedObjectAttrs>({
        type: 'dataset',
        perPage: 10,
        search: `"${title}"`,
        searchFields: ['title'],
        fields: ['title'],
      })
    ).filter((obj) => {
      return obj && obj.attributes && validateDatasetDataSourceReference(obj, dataSourceId);
    });

    return savedObjects.find((obj) => obj.attributes.title.toLowerCase() === title.toLowerCase());
  }
}

// This is used to validate datasource reference of index pattern
export const validateDatasetDataSourceReference = (
  dataset: SavedObject<DatasetSavedObjectAttrs>,
  dataSourceId?: string
) => {
  const references = dataset.references;
  if (dataSourceId) {
    return references.some((ref) => ref.id === dataSourceId && ref.type === 'data-source');
  } else {
    // No datasource id passed as input meaning we are getting index pattern from default cluster,
    // and it's supposed to be an empty array
    return references.length === 0;
  }
};

export const getDatasetTitle = async (
  datasetTitle: string,
  references: SavedObjectReference[],
  getDataSource: (id: string) => Promise<SavedObject<DataSourceAttributes>>
): Promise<string> => {
  let dataSourceTitle;
  const dataSourceReference = getDataSourceReference(references);

  // If an dataset references datasource, prepend data source name with index pattern name for display purpose
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
    return concatDataSourceWithDataset(dataSourceTitle, datasetTitle);
  } else {
    // if index pattern doesn't reference datasource, return as it is.
    return datasetTitle;
  }
};

export const concatDataSourceWithDataset = (dataSourceTitle: string, datasetTitle: string) => {
  const DATA_SOURCE_INDEX_PATTERN_DELIMITER = '::';

  return dataSourceTitle.concat(DATA_SOURCE_INDEX_PATTERN_DELIMITER).concat(datasetTitle);
};

export const getDataSourceReference = (references: SavedObjectReference[]) => {
  return references.find((ref) => ref.type === 'data-source');
};
