/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
