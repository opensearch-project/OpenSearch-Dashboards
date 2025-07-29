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

export const validateDataViewDataSourceReference = (
  dataView: SavedObject<DataViewSavedObjectAttrs>,
  dataSourceId?: string
) => {
  const references = dataView.references;
  if (dataSourceId) {
    return references.some((ref) => ref.id === dataSourceId && ref.type === 'data-source');
  } else {
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

  if (dataSourceReference) {
    const dataSourceId = dataSourceReference.id;
    try {
      const {
        attributes: { title },
        error,
      } = await getDataSource(dataSourceId);
      dataSourceTitle = error ? dataSourceId : title;
    } catch (e) {
      dataSourceTitle = dataSourceId;
    }
    return concatDataSourceWithDataView(dataSourceTitle, dataViewTitle);
  } else {
    return dataViewTitle;
  }
};

export const concatDataSourceWithDataView = (dataSourceTitle: string, dataViewTitle: string) => {
  const DATA_SOURCE_DATA_VIEW_DELIMITER = '::';

  return dataSourceTitle.concat(DATA_SOURCE_DATA_VIEW_DELIMITER).concat(dataViewTitle);
};

export const getDataSourceReference = (references: DataViewSavedObjectReference[]) => {
  return references.find((ref) => ref.type === 'data-source');
};

/**
 * Extracts dataset type from a URI pattern
 * @param uri - URI in format "type://name" (e.g., "s3://my-bucket", "index-pattern://logs-*")
 * @returns The dataset type in uppercase or undefined if not found
 */
export const extractDatasetTypeFromUri = (uri?: string): string | undefined => {
  if (!uri || !uri.includes('://')) {
    return undefined;
  }

  const [type] = uri.split('://');
  return type?.toUpperCase();
};

/**
 * Extracts data source information from a URI pattern
 * @param uri - URI in format "type://name/path"
 * @returns Object containing type and name
 */
export const extractDataSourceInfoFromUri = (uri?: string): { type?: string; name?: string } => {
  if (!uri) return {};

  if (uri.includes('://')) {
    const parts = uri.split('://');
    if (parts.length >= 2) {
      const type = parts[0].toUpperCase();
      const pathParts = parts[1].split('/');
      const name = pathParts[0];
      return { type, name };
    }
  }

  return { name: uri };
};

/**
 * Constructs a data source URI from type and name
 * @param type - Dataset type (e.g., "S3", "INDEX_PATTERN")
 * @param name - Data source name
 * @returns URI in format "type://name"
 */
export const constructDataSourceUri = (type: string, name: string): string => {
  return `${type.toLowerCase()}://${name}`;
};

/**
 * Gets the dataset type from a data source reference
 * @param dataSourceRef - The data source reference object
 * @returns The dataset type or undefined
 */
export const getDatasetTypeFromReference = (
  dataSourceRef?: DataViewSavedObjectReference
): string | undefined => {
  if (!dataSourceRef?.name) {
    return undefined;
  }
  return extractDatasetTypeFromUri(dataSourceRef.name);
};
