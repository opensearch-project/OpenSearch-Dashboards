/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectReference } from '../../../../core/public';
import { VisBuilderSavedObject } from '../types';
import { injectSearchSourceReferences } from '../../../data/public';

export function injectReferences(
  savedObject: VisBuilderSavedObject,
  references: SavedObjectReference[]
) {
  if (savedObject.searchSourceFields) {
    savedObject.searchSourceFields = injectSearchSourceReferences(
      savedObject.searchSourceFields as any,
      references
    );
  }
}
