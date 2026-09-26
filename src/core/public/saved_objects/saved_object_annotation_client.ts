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
  AddSavedObjectAnnotationToObjectInput,
  CreateSavedObjectAnnotationInput,
  DeleteSavedObjectAnnotationInput,
  FindSavedObjectAnnotationsOptions,
  GetSavedObjectAnnotationsForObjectInput,
  RemoveSavedObjectAnnotationFromObjectInput,
  SavedObjectAnnotation,
  SavedObjectAnnotationService,
  SetSavedObjectAnnotationsForObjectInput,
  UpdateSavedObjectAnnotationInput,
} from '../../types';
import { HttpSetup } from '../http';

const API_BASE_URL = '/internal/saved_object_annotations';

export class SavedObjectAnnotationClient implements SavedObjectAnnotationService {
  constructor(private readonly http: HttpSetup) {}

  public createAnnotation(input: CreateSavedObjectAnnotationInput): Promise<SavedObjectAnnotation> {
    return this.http.fetch(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public updateAnnotation({
    annotationId,
    ...input
  }: UpdateSavedObjectAnnotationInput): Promise<SavedObjectAnnotation> {
    return this.http.fetch(`${API_BASE_URL}/${encodeURIComponent(annotationId)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  public async deleteAnnotation({
    annotationId,
    type,
  }: DeleteSavedObjectAnnotationInput): Promise<void> {
    await this.http.fetch(`${API_BASE_URL}/${encodeURIComponent(annotationId)}`, {
      method: 'DELETE',
      query: { type },
    });
  }

  public findAnnotations(
    options: FindSavedObjectAnnotationsOptions
  ): Promise<SavedObjectAnnotation[]> {
    return this.http.fetch(`${API_BASE_URL}/_find`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  public async addAnnotationToObject(input: AddSavedObjectAnnotationToObjectInput): Promise<void> {
    await this.http.fetch(`${API_BASE_URL}/_attach`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async removeAnnotationFromObject(
    input: RemoveSavedObjectAnnotationFromObjectInput
  ): Promise<void> {
    await this.http.fetch(`${API_BASE_URL}/_detach`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async setAnnotationsForObject(
    input: SetSavedObjectAnnotationsForObjectInput
  ): Promise<void> {
    await this.http.fetch(`${API_BASE_URL}/_set_for_object`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public getAnnotationsForObject(
    input: GetSavedObjectAnnotationsForObjectInput
  ): Promise<SavedObjectAnnotation[]> {
    return this.http.fetch(`${API_BASE_URL}/_get_for_object`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}
