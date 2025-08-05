/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getFilterableOsdTypeNames,
  getOsdFieldOverrides,
  setOsdFieldOverrides,
} from '../../osd_field_types';
import { IDataViewFieldType } from './types';

const filterableTypes = getFilterableOsdTypeNames();

export function setOverrides(overrides: Record<string, any> | undefined) {
  setOsdFieldOverrides(overrides);
}

export function getOverrides(): Record<string, any> {
  return getOsdFieldOverrides();
}

export function isFilterable(field: IDataViewFieldType): boolean {
  if (getOverrides().filterable !== undefined) return !!getOverrides().filterable;
  return (
    field.name === '_id' ||
    field.scripted ||
    Boolean(field.searchable && filterableTypes.includes(field.type))
  );
}

export function isNestedField(field: IDataViewFieldType): boolean {
  return !!field.subType?.nested;
}
