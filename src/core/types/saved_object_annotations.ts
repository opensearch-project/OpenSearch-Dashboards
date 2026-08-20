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

export const SAVED_OBJECT_ANNOTATION_TYPE = 'saved-object-annotation';

export interface SavedObjectAnnotationTarget {
  objectType: string;
  objectId: string;
}

export interface CreateSavedObjectAnnotationInput {
  type: string;
  name: string;
  description?: string;
  payload?: Record<string, unknown>;
}

export interface UpdateSavedObjectAnnotationInput {
  annotationId: string;
  type: string;
  name?: string;
  description?: string;
  payload?: Record<string, unknown>;
}

export interface DeleteSavedObjectAnnotationInput {
  annotationId: string;
  type: string;
}

export interface FindSavedObjectAnnotationsOptions {
  type: string;
}

export interface SavedObjectAnnotation {
  id: string;
  type: string;
  name: string;
  description?: string;
  payload?: Record<string, unknown>;
}

export interface AddSavedObjectAnnotationToObjectInput {
  annotationId: string;
  type: string;
  target: SavedObjectAnnotationTarget;
}

export interface RemoveSavedObjectAnnotationFromObjectInput {
  annotationId: string;
  type: string;
  target: SavedObjectAnnotationTarget;
}

export interface GetSavedObjectAnnotationsForObjectInput {
  type: string;
  target: SavedObjectAnnotationTarget;
}

export interface SavedObjectAnnotationService {
  createAnnotation(input: CreateSavedObjectAnnotationInput): Promise<SavedObjectAnnotation>;
  updateAnnotation(input: UpdateSavedObjectAnnotationInput): Promise<SavedObjectAnnotation>;
  deleteAnnotation(input: DeleteSavedObjectAnnotationInput): Promise<void>;
  findAnnotations(options: FindSavedObjectAnnotationsOptions): Promise<SavedObjectAnnotation[]>;
  addAnnotationToObject(input: AddSavedObjectAnnotationToObjectInput): Promise<void>;
  removeAnnotationFromObject(input: RemoveSavedObjectAnnotationFromObjectInput): Promise<void>;
  getAnnotationsForObject(
    input: GetSavedObjectAnnotationsForObjectInput
  ): Promise<SavedObjectAnnotation[]>;
}
