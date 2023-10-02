/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes, SavedObjectReference } from '../../../../core/public';
import { AugmentVisSavedObjectAttributes } from '../../common';
import { AugmentVisSavedObject } from './types';

/**
 * Note that references aren't stored in the object's client-side interface (AugmentVisSavedObject).
 * Rather, just the ID/type is. The concept of references is a server-side definition used to define
 * relationships between saved objects. They are visible in the saved objs management page or
 * when making direct saved obj API calls.
 *
 * So, we need helper fns to construct & deconstruct references when creating and reading the
 * indexed/stored saved objects, respectively.
 */

/**
 * Using a constant value for the visualization name to easily extact/inject
 * the reference. Setting as "_0" which could be expanded and incremented upon
 * in the future if we decide to persist multiple visualizations per
 * AugmentVisSavedObject.
 */
export const VIS_REFERENCE_NAME = 'visualization_0';

/**
 * Used during creation. Converting from AugmentVisSavedObject to the actual indexed saved object
 * with references.
 */
export function extractReferences({
  attributes,
  references = [],
}: {
  attributes: SavedObjectAttributes;
  references: SavedObjectReference[];
}) {
  const updatedAttributes = { ...attributes } as AugmentVisSavedObjectAttributes;
  const updatedReferences = [...references];

  // Extract saved object
  if (updatedAttributes.visId) {
    updatedReferences.push({
      name: VIS_REFERENCE_NAME,
      type: 'visualization',
      id: String(updatedAttributes.visId),
    });
    delete updatedAttributes.visId;

    updatedAttributes.visName = VIS_REFERENCE_NAME;
  }
  return {
    references: updatedReferences,
    attributes: updatedAttributes,
  };
}

/**
 * Used during reading. Converting from the indexed saved object with references
 * to a AugmentVisSavedObject
 */
export function injectReferences(
  savedObject: AugmentVisSavedObject,
  references: SavedObjectReference[]
) {
  if (savedObject.visName) {
    const visReference = references.find((reference) => reference.name === savedObject.visName);
    if (!visReference) {
      throw new Error(`Could not find visualization reference "${savedObject.visName}"`);
    }
    savedObject.visId = visReference.id;
    delete savedObject.visName;
  }
}
