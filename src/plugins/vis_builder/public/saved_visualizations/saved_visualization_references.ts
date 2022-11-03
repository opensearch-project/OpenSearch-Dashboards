/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectReference } from '../../../../core/public';
import { VisBuilderVisSavedObject } from '../types';
import { injectSearchSourceReferences } from '../../../data/public';

export function injectReferences(
  savedObject: VisBuilderVisSavedObject,
  references: SavedObjectReference[]
) {
  if (savedObject.searchSourceFields) {
    savedObject.searchSourceFields = injectSearchSourceReferences(
      savedObject.searchSourceFields as any,
      references
    );
  }
}
