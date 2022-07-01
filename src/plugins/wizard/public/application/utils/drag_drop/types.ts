/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternField } from '../../../../../data/common';

export interface EmptyDragDataType {
  namespace: null;
  value: null;
}
export interface FieldDragDataType {
  namespace: 'field-data';
  value: Pick<IndexPatternField, 'name' | 'displayName' | 'type'> | null;
}

export type DragDataType = EmptyDragDataType | FieldDragDataType;
