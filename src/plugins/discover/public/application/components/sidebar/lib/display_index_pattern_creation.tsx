/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern, DATA_FRAME_TYPES } from '../../../../../../data/public';

/**
 * if we should display index pattern creation in the sidebar
 */
export function displayIndexPatternCreation(indexPattern: IndexPattern | undefined): boolean {
  if (!indexPattern || !indexPattern.type || !indexPattern.id) return false;
  return (
    Object.values(DATA_FRAME_TYPES).includes(indexPattern.type as DATA_FRAME_TYPES) &&
    Object.values(DATA_FRAME_TYPES).includes(indexPattern.id as DATA_FRAME_TYPES)
  );
}
