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

import { SavedObjectReference } from '../../../../core/public';
import { WizardVisSavedObject } from '../types';
import { injectSearchSourceReferences } from '../../../data/public';

export function injectReferences(
  savedObject: WizardVisSavedObject,
  references: SavedObjectReference[]
) {
  if (savedObject.searchSourceFields) {
    savedObject.searchSourceFields = injectSearchSourceReferences(
      savedObject.searchSourceFields as any,
      references
    );
  }
}
