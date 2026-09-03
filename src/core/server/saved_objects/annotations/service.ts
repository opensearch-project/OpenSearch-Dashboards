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
  SAVED_OBJECT_ANNOTATION_TYPE,
  SetSavedObjectAnnotationsForObjectInput,
  UpdateSavedObjectAnnotationInput,
} from '../../../types';
import { SavedObject, SavedObjectsClientContract } from '../types';
import { SavedObjectsErrorHelpers, SavedObjectsFindResponse } from '../service';
import {
  SavedObjectAnnotationTypeRegistration,
  SavedObjectAnnotationTypeRegistry,
} from './registry';
import { SavedObjectAnnotationAttributes } from './saved_object_type';
import {
  createSavedObjectAnnotationReferenceName,
  isSavedObjectAnnotationReference,
} from './reference_utils';

const FIND_PAGE_SIZE = 1000;

const hasOwn = (object: object, property: string) =>
  Object.prototype.hasOwnProperty.call(object, property);

const normalizeAnnotationName = (name: string) => name.trim().toLowerCase();

export class SavedObjectAnnotationServiceImpl implements SavedObjectAnnotationService {
  constructor(
    private readonly client: SavedObjectsClientContract,
    private readonly mutationClient: SavedObjectsClientContract,
    private readonly registry: SavedObjectAnnotationTypeRegistry
  ) {}

  public async createAnnotation(
    input: CreateSavedObjectAnnotationInput
  ): Promise<SavedObjectAnnotation> {
    const registration = this.registry.get(input.type);
    await this.ensureUniqueName(registration, input.name);
    const savedObject = await this.client.create<SavedObjectAnnotationAttributes>(
      SAVED_OBJECT_ANNOTATION_TYPE,
      this.serializeCreateInput(input)
    );
    return this.deserialize(savedObject);
  }

  public async updateAnnotation(
    input: UpdateSavedObjectAnnotationInput
  ): Promise<SavedObjectAnnotation> {
    const registration = this.registry.get(input.type);
    const existing = await this.getAndValidateAnnotation(input.annotationId, input.type);
    const attributes: Partial<SavedObjectAnnotationAttributes> = {};

    if (hasOwn(input, 'name') && input.name !== undefined) {
      await this.ensureUniqueName(registration, input.name, input.annotationId);
      attributes.name = input.name;
    }
    if (hasOwn(input, 'description')) {
      attributes.description = input.description;
    }
    if (hasOwn(input, 'payload')) {
      attributes.payload = JSON.stringify(input.payload);
    }

    const updated = await this.client.update<SavedObjectAnnotationAttributes>(
      SAVED_OBJECT_ANNOTATION_TYPE,
      input.annotationId,
      attributes
    );

    return this.deserialize({
      ...existing,
      ...updated,
      attributes: {
        ...existing.attributes,
        ...updated.attributes,
      },
      references: existing.references,
    });
  }

  public async deleteAnnotation(input: DeleteSavedObjectAnnotationInput): Promise<void> {
    const registration = this.registry.get(input.type);
    await this.getAndValidateAnnotation(input.annotationId, input.type);

    const targets = await this.findAll({
      type: registration.supportedObjectTypes,
      hasReference: {
        type: SAVED_OBJECT_ANNOTATION_TYPE,
        id: input.annotationId,
      },
    });

    if (targets.length) {
      const result = await this.mutationClient.bulkUpdate(
        targets.map((target) => ({
          type: target.type,
          id: target.id,
          attributes: {},
          references: target.references.filter(
            (reference) =>
              !(isSavedObjectAnnotationReference(reference) && reference.id === input.annotationId)
          ),
        }))
      );
      const failedUpdate = result.saved_objects.find(({ error }) => error);
      if (failedUpdate?.error) {
        throw new Error(failedUpdate.error.message);
      }
    }

    await this.client.delete(SAVED_OBJECT_ANNOTATION_TYPE, input.annotationId);
  }

  public async findAnnotations({
    type,
  }: FindSavedObjectAnnotationsOptions): Promise<SavedObjectAnnotation[]> {
    this.registry.get(type);
    const savedObjects = await this.findAll<SavedObjectAnnotationAttributes>({
      type: SAVED_OBJECT_ANNOTATION_TYPE,
      filter: `${SAVED_OBJECT_ANNOTATION_TYPE}.attributes.type: ${JSON.stringify(type)}`,
    });
    return savedObjects.map((savedObject) => this.deserialize(savedObject));
  }

  public async addAnnotationToObject({
    annotationId,
    type,
    target,
  }: AddSavedObjectAnnotationToObjectInput): Promise<void> {
    this.validateTarget(type, target.objectType);
    await this.getAndValidateAnnotation(annotationId, type);
    const targetObject = await this.mutationClient.get(target.objectType, target.objectId);

    if (
      targetObject.references.some(
        (reference) => isSavedObjectAnnotationReference(reference) && reference.id === annotationId
      )
    ) {
      return;
    }

    await this.mutationClient.update(
      target.objectType,
      target.objectId,
      {},
      {
        references: [
          ...targetObject.references,
          {
            name: createSavedObjectAnnotationReferenceName(targetObject.references),
            type: SAVED_OBJECT_ANNOTATION_TYPE,
            id: annotationId,
          },
        ],
      }
    );
  }

  public async removeAnnotationFromObject({
    annotationId,
    type,
    target,
  }: RemoveSavedObjectAnnotationFromObjectInput): Promise<void> {
    this.validateTarget(type, target.objectType);
    try {
      await this.getAndValidateAnnotation(annotationId, type);
    } catch (error) {
      if (!SavedObjectsErrorHelpers.isNotFoundError(error)) {
        throw error;
      }
    }

    const targetObject = await this.mutationClient.get(target.objectType, target.objectId);
    const references = targetObject.references.filter(
      (reference) => !(isSavedObjectAnnotationReference(reference) && reference.id === annotationId)
    );

    if (references.length === targetObject.references.length) {
      return;
    }

    await this.mutationClient.update(
      target.objectType,
      target.objectId,
      {},
      {
        references,
      }
    );
  }

  public async setAnnotationsForObject({
    annotationIds,
    type,
    target,
  }: SetSavedObjectAnnotationsForObjectInput): Promise<void> {
    // 1. Validate the target and load its current references.
    this.validateTarget(type, target.objectType);
    const targetObject = await this.mutationClient.get(target.objectType, target.objectId);
    const selectedAnnotationIds = new Set(annotationIds);

    // 2. Resolve current annotations to preserve other types and detect 404 orphan references,
    // and resolve selected annotations so they can be validated.
    const annotationIdsToResolve = new Set(
      targetObject.references.filter(isSavedObjectAnnotationReference).map(({ id }) => id)
    );
    selectedAnnotationIds.forEach((annotationId) => annotationIdsToResolve.add(annotationId));
    const annotations = annotationIdsToResolve.size
      ? (
          await this.client.bulkGet<SavedObjectAnnotationAttributes>(
            Array.from(annotationIdsToResolve, (id) => ({
              type: SAVED_OBJECT_ANNOTATION_TYPE,
              id,
            }))
          )
        ).saved_objects
      : [];
    const annotationsById = new Map(annotations.map((annotation) => [annotation.id, annotation]));

    // 3. Validate that every selected annotation exists and belongs to the requested type.
    selectedAnnotationIds.forEach((annotationId) => {
      const annotation = annotationsById.get(annotationId);
      if (!annotation || annotation.error?.statusCode === 404) {
        throw SavedObjectsErrorHelpers.createGenericNotFoundError(
          SAVED_OBJECT_ANNOTATION_TYPE,
          annotationId
        );
      }
      if (annotation.error) {
        throw new Error(annotation.error.message);
      }
      if (annotation.attributes.type !== type) {
        throw SavedObjectsErrorHelpers.createBadRequestError(
          `Annotation '${annotationId}' is not of type '${type}'`
        );
      }
    });

    // 4. Preserve unrelated references while removing this type and missing annotations.
    const references = targetObject.references.filter((reference) => {
      if (!isSavedObjectAnnotationReference(reference)) {
        return true;
      }

      const annotation = annotationsById.get(reference.id);
      // Only missing definitions are orphaned; other lookup errors must not delete references.
      if (!annotation || annotation.error?.statusCode === 404) {
        return false;
      }
      if (annotation.error) {
        return true;
      }
      if (annotation.attributes.type !== type) {
        return true;
      }
      return false;
    });

    // 5. Add the complete selected annotation set with fresh reference names.
    selectedAnnotationIds.forEach((annotationId) => {
      references.push({
        name: createSavedObjectAnnotationReferenceName(references),
        type: SAVED_OBJECT_ANNOTATION_TYPE,
        id: annotationId,
      });
    });

    // 6. Persist the rebuilt references in one target update.
    await this.mutationClient.update(
      target.objectType,
      target.objectId,
      {},
      {
        references,
      }
    );
  }

  public async getAnnotationsForObject({
    type,
    target,
  }: GetSavedObjectAnnotationsForObjectInput): Promise<SavedObjectAnnotation[]> {
    this.validateTarget(type, target.objectType);
    const targetObject = await this.client.get(target.objectType, target.objectId);
    const annotationReferences = targetObject.references.filter(isSavedObjectAnnotationReference);

    if (!annotationReferences.length) {
      return [];
    }

    const response = await this.client.bulkGet<SavedObjectAnnotationAttributes>(
      annotationReferences.map(({ id }) => ({
        type: SAVED_OBJECT_ANNOTATION_TYPE,
        id,
      }))
    );
    const annotations = new Map(
      response.saved_objects
        .filter(
          (savedObject): savedObject is SavedObject<SavedObjectAnnotationAttributes> =>
            !savedObject.error && savedObject.attributes?.type === type
        )
        .map((savedObject) => [savedObject.id, this.deserialize(savedObject)])
    );

    return annotationReferences
      .map(({ id }) => annotations.get(id))
      .filter((annotation): annotation is SavedObjectAnnotation => annotation !== undefined);
  }

  private validateTarget(type: string, objectType: string) {
    const registration = this.registry.get(type);
    if (!registration.supportedObjectTypes.includes(objectType)) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        `Annotation type '${type}' does not support saved object type '${objectType}'`
      );
    }
  }

  private async getAndValidateAnnotation(annotationId: string, type: string) {
    const savedObject = await this.client.get<SavedObjectAnnotationAttributes>(
      SAVED_OBJECT_ANNOTATION_TYPE,
      annotationId
    );
    if (savedObject.attributes.type !== type) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        `Annotation '${annotationId}' is not of type '${type}'`
      );
    }
    return savedObject;
  }

  private serializeCreateInput(
    input: CreateSavedObjectAnnotationInput
  ): SavedObjectAnnotationAttributes {
    return {
      type: input.type,
      name: input.name,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.payload !== undefined && { payload: JSON.stringify(input.payload) }),
    };
  }

  private deserialize(
    savedObject: SavedObject<SavedObjectAnnotationAttributes>
  ): SavedObjectAnnotation {
    const { type, name, description, payload } = savedObject.attributes;
    return {
      id: savedObject.id,
      type,
      name,
      ...(description !== undefined && { description }),
      ...(payload !== undefined && { payload: JSON.parse(payload) }),
    };
  }

  private async ensureUniqueName(
    registration: SavedObjectAnnotationTypeRegistration,
    name: string,
    annotationId?: string
  ) {
    if (!registration.uniqueName) {
      return;
    }

    const normalizedName = normalizeAnnotationName(name);
    const annotations = await this.findAll<SavedObjectAnnotationAttributes>({
      type: SAVED_OBJECT_ANNOTATION_TYPE,
      filter: `${SAVED_OBJECT_ANNOTATION_TYPE}.attributes.type: ${JSON.stringify(
        registration.type
      )}`,
    });
    const duplicate = annotations.find(
      (annotation) =>
        annotation.id !== annotationId &&
        normalizeAnnotationName(annotation.attributes.name) === normalizedName
    );

    if (duplicate) {
      throw SavedObjectsErrorHelpers.decorateConflictError(
        new Error('Conflict'),
        `An annotation of type '${registration.type}' named '${name.trim()}' already exists`
      );
    }
  }

  private async findAll<T = unknown>(
    options: Omit<Parameters<SavedObjectsClientContract['find']>[0], 'page' | 'perPage'>
  ): Promise<Array<SavedObject<T>>> {
    const savedObjects: Array<SavedObject<T>> = [];
    let page = 1;
    let response: SavedObjectsFindResponse<T>;

    do {
      response = await this.client.find<T>({
        ...options,
        page,
        perPage: FIND_PAGE_SIZE,
      });
      savedObjects.push(...response.saved_objects);
      page += 1;
    } while (savedObjects.length < response.total);

    return savedObjects;
  }
}
