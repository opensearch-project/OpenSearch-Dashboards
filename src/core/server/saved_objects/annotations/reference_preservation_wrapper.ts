/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import {
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkUpdateObject,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsErrorHelpers,
  SavedObjectsUpdateOptions,
} from '../service';
import { preserveSavedObjectAnnotationReferences } from './reference_utils';

export const ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_ID =
  'saved-object-annotation-reference-preservation';
export const ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_PRIORITY = Number.MIN_SAFE_INTEGER;

export const annotationReferencePreservationWrapper: SavedObjectsClientWrapperFactory = ({
  client,
}) => {
  const preserveReferences = async (
    type: string,
    id: string,
    incomingReferences: NonNullable<SavedObjectsCreateOptions['references']>
  ) => {
    try {
      const persistedObject = await client.get(type, id);
      return preserveSavedObjectAnnotationReferences(
        persistedObject.references,
        incomingReferences
      );
    } catch (error) {
      if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
        return incomingReferences;
      }
      throw error;
    }
  };

  const create: typeof client.create = async (
    type,
    attributes,
    options: SavedObjectsCreateOptions = {}
  ) => {
    if (!options.overwrite || !options.id || !Array.isArray(options.references)) {
      return client.create(type, attributes, options);
    }

    return client.create(type, attributes, {
      ...options,
      references: await preserveReferences(type, options.id, options.references),
    });
  };

  const bulkCreate: typeof client.bulkCreate = async <T = unknown>(
    objects: Array<SavedObjectsBulkCreateObject<T>>,
    options: SavedObjectsCreateOptions = {}
  ) => {
    if (!options.overwrite) {
      return client.bulkCreate(objects, options);
    }

    const objectsWithPreservedReferences = await Promise.all(
      objects.map(async (object) => {
        if (!object.id || !Array.isArray(object.references)) {
          return object;
        }

        return {
          ...object,
          references: await preserveReferences(object.type, object.id, object.references),
        };
      })
    );

    return client.bulkCreate(objectsWithPreservedReferences, options);
  };

  const update: typeof client.update = async (
    type,
    id,
    attributes,
    options: SavedObjectsUpdateOptions = {}
  ) => {
    if (!Array.isArray(options.references)) {
      return client.update(type, id, attributes, options);
    }

    const persistedObject = await client.get(type, id);
    return client.update(type, id, attributes, {
      ...options,
      references: preserveSavedObjectAnnotationReferences(
        persistedObject.references,
        options.references
      ),
    });
  };

  const bulkUpdate: typeof client.bulkUpdate = async (
    objects: SavedObjectsBulkUpdateObject[] = [],
    options = {}
  ) => {
    const objectsWithPreservedReferences = await Promise.all(
      objects.map(async (object) => {
        if (!Array.isArray(object.references)) {
          return object;
        }

        const persistedObject = await client.get(object.type, object.id);
        return {
          ...object,
          references: preserveSavedObjectAnnotationReferences(
            persistedObject.references,
            object.references
          ),
        };
      })
    );

    return client.bulkUpdate(objectsWithPreservedReferences, options);
  };

  return Object.assign(Object.create(client), {
    create,
    bulkCreate,
    update,
    bulkUpdate,
  });
};
