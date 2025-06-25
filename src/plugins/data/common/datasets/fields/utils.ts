/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getFilterableOsdTypeNames,
  getOsdFieldOverrides,
  setOsdFieldOverrides,
} from '../../osd_field_types';
import { IDatasetFieldType } from './types';

const filterableTypes = getFilterableOsdTypeNames();

export function setDatasetOverrides(overrides: Record<string, any> | undefined) {
  setOsdFieldOverrides(overrides);
}

export function getDatasetOverrides(): Record<string, any> {
  return getOsdFieldOverrides();
}

export function isDatasetFilterable(field: IDatasetFieldType): boolean {
  if (getDatasetOverrides().filterable !== undefined) return !!getDatasetOverrides().filterable;
  return (
    field.name === '_id' ||
    field.scripted ||
    Boolean(field.searchable && filterableTypes.includes(field.type))
  );
}

export function isDatasetNestedField(field: IDatasetFieldType): boolean {
  return !!field.subType?.nested;
}
