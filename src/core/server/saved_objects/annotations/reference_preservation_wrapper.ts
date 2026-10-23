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
  SavedObjectsUpdateOptions,
} from '../service';
import { preserveSavedObjectAnnotationReferences } from './reference_utils';

export const ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_ID =
  'saved-object-annotation-reference-preservation';
export const ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_PRIORITY = Number.MIN_SAFE_INTEGER;

export const annotationReferencePreservationWrapper: SavedObjectsClientWrapperFactory = ({
  client,
}) => {
  const preserveReferences = async <
    T extends {
      type: string;
      id?: string;
      references?: SavedObjectsCreateOptions['references'];
    },
  >(
    objects: T[]
  ): Promise<T[]> => {
    // Only writes with an ID and an explicit references array can replace existing
    // annotation references, so objects without either value do not need to be read.
    const objectIndexesToResolve = objects.reduce<number[]>((indexes, object, index) => {
      if (object.id && Array.isArray(object.references)) {
        indexes.push(index);
      }
      return indexes;
    }, []);

    if (!objectIndexesToResolve.length) {
      return objects;
    }

    // Resolve all target objects in one request so bulk writes do not issue one read
    // per object. bulkGet returns results in the same order as the requested objects.
    const { saved_objects: persistedObjects } = await client.bulkGet(
      objectIndexesToResolve.map((index) => ({
        type: objects[index].type,
        id: objects[index].id!,
      }))
    );
    const objectsWithPreservedReferences = [...objects];

    objectIndexesToResolve.forEach((objectIndex, persistedObjectIndex) => {
      const object = objects[objectIndex];
      const persistedObject = persistedObjects[persistedObjectIndex];

      if (persistedObject.error) {
        // A missing target has no annotation references to preserve. Leave it unchanged
        // and let create, update, or bulkUpdate apply its normal not-found behavior.
        if (persistedObject.error.statusCode === 404) {
          return;
        }
        // Other lookup errors may hide an existing target, so stop instead of risking
        // an update that unintentionally removes its annotation references.
        throw new Error(persistedObject.error.message);
      }

      // Incoming non-annotation references remain authoritative while persisted
      // annotation attachments are restored to prevent ordinary saves from removing them.
      objectsWithPreservedReferences[objectIndex] = {
        ...object,
        references: preserveSavedObjectAnnotationReferences(
          persistedObject.references,
          object.references!
        ),
      };
    });

    return objectsWithPreservedReferences;
  };

  const create: typeof client.create = async (
    type,
    attributes,
    options: SavedObjectsCreateOptions = {}
  ) => {
    if (!options.overwrite || !options.id || !Array.isArray(options.references)) {
      return client.create(type, attributes, options);
    }

    const [objectWithPreservedReferences] = await preserveReferences([
      { type, id: options.id, references: options.references },
    ]);

    return client.create(type, attributes, {
      ...options,
      references: objectWithPreservedReferences.references,
    });
  };

  const bulkCreate: typeof client.bulkCreate = async <T = unknown>(
    objects: Array<SavedObjectsBulkCreateObject<T>>,
    options: SavedObjectsCreateOptions = {}
  ) => {
    if (!options.overwrite) {
      return client.bulkCreate(objects, options);
    }

    const objectsWithPreservedReferences = await preserveReferences(objects);

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

    const [objectWithPreservedReferences] = await preserveReferences([
      { type, id, references: options.references },
    ]);

    return client.update(type, id, attributes, {
      ...options,
      references: objectWithPreservedReferences.references,
    });
  };

  const bulkUpdate: typeof client.bulkUpdate = async (
    objects: SavedObjectsBulkUpdateObject[] = [],
    options = {}
  ) => {
    const objectsWithPreservedReferences = await preserveReferences(objects);

    return client.bulkUpdate(objectsWithPreservedReferences, options);
  };

  return Object.assign(Object.create(client), {
    create,
    bulkCreate,
    update,
    bulkUpdate,
  });
};
