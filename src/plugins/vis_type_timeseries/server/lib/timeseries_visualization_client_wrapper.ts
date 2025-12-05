/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsClientContract,
  SavedObjectsClientWrapperFactory,
  SavedObjectsClientWrapperOptions,
  SavedObjectsCreateOptions,
  SavedObjectsErrorHelpers,
} from '../../../../core/server';
import { getDataSourceEnabled } from './services';

export const TIMESERIES_VISUALIZATION_CLIENT_WRAPPER_ID = 'timeseries-visualization-client-wrapper';
/**
 * A lower priority number means that a wrapper will be first to execute.
 * In this case, since this wrapper does not have any conflicts with other wrappers, it is set to 11.
 * */
export const TIMESERIES_VISUALIZATION_CLIENT_WRAPPER_PRIORITY = 11;

export const timeSeriesVisualizationClientWrapper: SavedObjectsClientWrapperFactory = (
  wrapperOptions: SavedObjectsClientWrapperOptions
) => {
  const createForTimeSeries = async <T = unknown>(
    type: string,
    attributes: T,
    options?: SavedObjectsCreateOptions
  ) => {
    if (type !== 'visualization' || !getDataSourceEnabled().enabled) {
      return await wrapperOptions.client.create(type, attributes, options);
    }

    const tsvbAttributes = attributes as T & { visState: string };
    let visState;
    try {
      visState = JSON.parse(tsvbAttributes.visState);
    } catch (ex) {
      throw SavedObjectsErrorHelpers.createUnsupportedTypeError(type);
    }

    if (visState.type !== 'metrics' || !visState.params) {
      return await wrapperOptions.client.create(type, attributes, options);
    }

    const newReferences = options?.references?.filter(
      (reference) => reference.type !== 'data-source'
    );

    if (visState.params.data_source_id) {
      try {
        if (await checkIfDataSourceExists(visState.params.data_source_id, wrapperOptions.client)) {
          newReferences?.push({
            id: visState.params.data_source_id,
            name: 'dataSource',
            type: 'data-source',
          });
        } else {
          delete visState.params.data_source_id;
        }
      } catch (err) {
        const errMsg = `Failed to fetch existing data source for dataSourceId [${visState.params.data_source_id}]`;
        throw SavedObjectsErrorHelpers.decorateBadRequestError(err, errMsg);
      }
    }

    tsvbAttributes.visState = JSON.stringify(visState);

    return await wrapperOptions.client.create(type, attributes, {
      ...options,
      references: newReferences,
    });
  };

  return {
    ...wrapperOptions.client,
    create: createForTimeSeries,
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

const checkIfDataSourceExists = async (
  id: string,
  client: SavedObjectsClientContract
): Promise<boolean> => {
  return client.get('data-source', id).then((response) => !!response.attributes);
};
