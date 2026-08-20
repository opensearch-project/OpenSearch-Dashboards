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
  SavedObjectsBulkUpdateObject,
  SavedObjectsClientWrapperFactory,
  SavedObjectsUpdateOptions,
} from '../service';
import { preserveSavedObjectAnnotationReferences } from './reference_utils';

export const ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_ID =
  'saved-object-annotation-reference-preservation';
export const ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_PRIORITY = Number.MIN_SAFE_INTEGER;

export const annotationReferencePreservationWrapper: SavedObjectsClientWrapperFactory = ({
  client,
}) => {
  const update: typeof client.update = async (
    type,
    id,
    attributes,
    options: SavedObjectsUpdateOptions = {}
  ) => {
    if (!Array.isArray(options.references)) {
      return client.update(type, id, attributes, options);
    }

    const persistedObject = await client.get(type, id, {
      namespace: options.namespace,
      workspaces: options.workspaces,
    });
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

        const persistedObject = await client.get(object.type, object.id, {
          namespace: object.namespace ?? options.namespace,
          workspaces: object.workspaces,
        });
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
    update,
    bulkUpdate,
  });
};
