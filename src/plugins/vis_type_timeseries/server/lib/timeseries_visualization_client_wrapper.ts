/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsClientWrapperFactory,
  SavedObjectsClientWrapperOptions,
  SavedObjectsCreateOptions,
} from '../../../../core/server';
import { getDataSourceEnabled } from './services';

export const TIMESERIES_VISUALIZATION_CLIENT_WRAPPER_ID = 'timeseries-visualization-client-wrapper';

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

    // @ts-expect-error
    const visState = JSON.parse(attributes.visState);

    if (visState.type !== 'metrics' || !visState.params) {
      return await wrapperOptions.client.create(type, attributes, options);
    }

    const newReferences = options?.references?.filter(
      (reference) => reference.type !== 'data-source'
    );

    if (visState.params.data_source_id) {
      newReferences?.push({
        id: visState.params.data_source_id,
        name: 'dataSource',
        type: 'data-source',
      });
    }

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
