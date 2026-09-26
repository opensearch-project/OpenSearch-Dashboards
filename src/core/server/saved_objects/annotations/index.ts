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

export {
  SavedObjectAnnotationsSetup,
  SavedObjectAnnotationTypeRegistration,
  SavedObjectAnnotationTypeRegistry,
} from './registry';
export { SavedObjectAnnotationServiceImpl } from './service';
export { savedObjectAnnotationType, SavedObjectAnnotationAttributes } from './saved_object_type';
export {
  ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_ID,
  ANNOTATION_REFERENCE_PRESERVATION_WRAPPER_PRIORITY,
  annotationReferencePreservationWrapper,
} from './reference_preservation_wrapper';
export { registerSavedObjectAnnotationRoutes } from './routes';
