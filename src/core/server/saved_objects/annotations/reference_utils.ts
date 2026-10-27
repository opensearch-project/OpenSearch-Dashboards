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

import { SavedObjectReference, SAVED_OBJECT_ANNOTATION_TYPE } from '../../../types';

export const isSavedObjectAnnotationReference = (reference: SavedObjectReference) =>
  reference.type === SAVED_OBJECT_ANNOTATION_TYPE;

export const preserveSavedObjectAnnotationReferences = (
  persistedReferences: SavedObjectReference[],
  incomingReferences: SavedObjectReference[]
) => [
  ...incomingReferences.filter((reference) => !isSavedObjectAnnotationReference(reference)),
  ...persistedReferences.filter(isSavedObjectAnnotationReference),
];

export const createSavedObjectAnnotationReferenceName = (
  references: SavedObjectReference[]
): string => {
  const referenceNames = new Set(references.map(({ name }) => name));
  let index = 0;
  while (referenceNames.has(`annotation_${index}`)) {
    index += 1;
  }
  return `annotation_${index}`;
};
