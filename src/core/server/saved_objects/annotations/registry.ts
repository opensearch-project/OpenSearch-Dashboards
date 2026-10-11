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

import { SavedObjectsErrorHelpers } from '../service/lib/errors';

export interface SavedObjectAnnotationTypeRegistration {
  type: string;
  supportedObjectTypes: string[];
  /**
   * Reject names that match an existing annotation of this type after trimming
   * whitespace and applying case-insensitive comparison.
   */
  uniqueName?: boolean;
}

export interface SavedObjectAnnotationsSetup {
  enabled: boolean;
  registerAnnotationType(registration: SavedObjectAnnotationTypeRegistration): void;
}

export class SavedObjectAnnotationTypeRegistry {
  private readonly registrations = new Map<string, SavedObjectAnnotationTypeRegistration>();

  public register(registration: SavedObjectAnnotationTypeRegistration) {
    const { type, supportedObjectTypes, uniqueName } = registration;
    if (!type) {
      throw new Error('Annotation type must be a non-empty string');
    }
    if (this.registrations.has(type)) {
      throw new Error(`Annotation type '${type}' is already registered`);
    }
    if (!supportedObjectTypes.length) {
      throw new Error(`Annotation type '${type}' must support at least one saved object type`);
    }

    this.registrations.set(type, {
      type,
      supportedObjectTypes: Array.from(new Set(supportedObjectTypes)),
      ...(uniqueName && { uniqueName }),
    });
  }

  public get(type: string): SavedObjectAnnotationTypeRegistration {
    const registration = this.registrations.get(type);
    if (!registration) {
      throw SavedObjectsErrorHelpers.createBadRequestError(
        `Annotation type '${type}' is not registered`
      );
    }
    return registration;
  }
}
