/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternField, METRIC_TYPES } from '../../../../../data/common';

export const COUNT_FIELD = Symbol.for(METRIC_TYPES.COUNT);

export interface EmptyDragDataType {
  namespace: null;
  value: null;
}
export interface FieldDragDataType {
  namespace: 'field-data';
  value: IndexPatternField['name'] | null | typeof COUNT_FIELD;
}

export type DragDataType = EmptyDragDataType | FieldDragDataType;
