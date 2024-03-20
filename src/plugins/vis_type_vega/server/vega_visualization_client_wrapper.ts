/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsClientWrapperFactory,
  SavedObjectsClientWrapperOptions,
  SavedObjectsCreateOptions,
  SavedObjectsErrorHelpers,
} from '../../../core/server';
import {
  extractDataSourceNamesInVegaSpec,
  extractVegaSpecFromAttributes,
  findDataSourceIdbyName,
} from './utils';
import { getDataSourceEnabled } from './services';

export const VEGA_VISUALIZATION_CLIENT_WRAPPER_ID = 'vega-visualization-client-wrapper';

export const vegaVisualizationClientWrapper: SavedObjectsClientWrapperFactory = (
  wrapperOptions: SavedObjectsClientWrapperOptions
) => {
  const createForVega = async <T = unknown>(
    type: string,
    attributes: T,
    options?: SavedObjectsCreateOptions
  ) => {
    const vegaSpec = extractVegaSpecFromAttributes(attributes);
    if (type !== 'visualization' || vegaSpec === undefined || !getDataSourceEnabled().enabled) {
      return await wrapperOptions.client.create(type, attributes, options);
    }
    const dataSourceNamesSet = extractDataSourceNamesInVegaSpec(vegaSpec);

    const existingDataSourceReferences = options?.references
      ?.filter((reference) => reference.type === 'data-source')
      .map((dataSourceReference) => {
        return {
          id: dataSourceReference.id,
          type: dataSourceReference.type,
        };
      });

    const existingDataSourceIdToNameMap = new Map();
    if (!!existingDataSourceReferences && existingDataSourceReferences.length > 0) {
      (await wrapperOptions.client.bulkGet(existingDataSourceReferences)).saved_objects.forEach(
        (object) => {
          // @ts-expect-error
          if (!!object.attributes && !!object.attributes.title) {
            // @ts-expect-error
            existingDataSourceIdToNameMap.set(object.id, object.attributes.title);
          }
        }
      );
    }

    // Filters out outdated datasource references
    const newReferences = options?.references?.filter((reference) => {
      if (reference.type !== 'data-source') {
        return true;
      }
      const dataSourceName = existingDataSourceIdToNameMap.get(reference.id);
      if (dataSourceNamesSet.has(dataSourceName)) {
        dataSourceNamesSet.delete(dataSourceName);
        return true;
      }

      return false;
    });

    for await (const dataSourceName of dataSourceNamesSet) {
      const dataSourceId = await findDataSourceIdbyName({
        dataSourceName,
        savedObjectsClient: wrapperOptions.client,
      });
      if (dataSourceId) {
        newReferences?.push({
          id: dataSourceId,
          name: 'dataSource',
          type: 'data-source',
        });
      } else {
        throw SavedObjectsErrorHelpers.createBadRequestError(
          `data_source_name "${dataSourceName}" cannot be found in saved objects`
        );
      }
    }

    return await wrapperOptions.client.create(type, attributes, {
      ...options,
      references: newReferences,
    });
  };

  return {
    ...wrapperOptions.client,
    create: createForVega,
    bulkCreate: wrapperOptions.client.bulkCreate,
    checkConflicts: wrapperOptions.client.checkConflicts,
    delete: wrapperOptions.client.delete,
    find: wrapperOptions.client.find,
    bulkGet: wrapperOptions.client.bulkGet,
    get: wrapperOptions.client.get,
    update: wrapperOptions.client.update,
    bulkUpdate: wrapperOptions.client.bulkUpdate,
    errors: wrapperOptions.client.errors,
    addToNamespaces: wrapperOptions.client.addToNamespaces,
    deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
  };
};
