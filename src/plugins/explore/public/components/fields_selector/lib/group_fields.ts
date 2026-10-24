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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { DataViewField } from '../../../../../data/public';
import { FieldFilterState, isFieldFiltered } from './field_filter';

// TODO: Use data set defined faceted field
const FACET_FIELDS = [
  'resource.attributes.service.name',
  'attributes.http.status_code',
  'status.code',
] as const;

function isFacetedField(fieldName: string): fieldName is (typeof FACET_FIELDS)[number] {
  // Remove invisiable char
  const normalizedFieldName = fieldName.replace(/[\u200b-\u200f\uFEFF]/g, '');
  return (FACET_FIELDS as readonly string[]).includes(normalizedFieldName);
}

export interface GroupedFields {
  facetedFields: DataViewField[];
  selectedFields: DataViewField[];
  queryFields: DataViewField[];
  discoveredFields: DataViewField[];
}

// One collator for the sidebar: `Intl.Collator#compare` is several times cheaper than
// `String#localeCompare`, which re-resolves the locale on every call.
const fieldNameCollator = new Intl.Collator();

export function compareFieldNames(a: DataViewField, b: DataViewField): number {
  if (!a.displayName) {
    return 0;
  }
  return fieldNameCollator.compare(a.displayName, b.displayName || '');
}

/**
 * Sort fields by display name. The result only depends on the field list itself, so callers
 * should memoize it per dataset rather than re-sorting on every result.
 */
export function sortFields(fields: Iterable<DataViewField> | null | undefined): DataViewField[] {
  if (!fields) {
    return [];
  }
  // fields are not regular JS array but a custom class extending native array and it breaks native array method (e.g. filter())
  // Convert FldList to proper Array for sorting to work correctly
  // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/d7004dc5b0392477fdd54ac66b29d231975a173b/src/plugins/data/common/index_patterns/fields/field_list.ts
  return Array.from(fields).sort(compareFieldNames);
}

/**
 * Merge two lists that are each already sorted by `compareFieldNames` into one sorted list.
 */
export function mergeSortedFields(a: DataViewField[], b: DataViewField[]): DataViewField[] {
  if (a.length === 0) return b;
  if (b.length === 0) return a;
  const result: DataViewField[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (compareFieldNames(a[i], b[j]) <= 0) {
      result.push(a[i++]);
    } else {
      result.push(b[j++]);
    }
  }
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}

/**
 * Split already-sorted fields into selected, query (present in the current hits) and discovered
 * groups, applying the sidebar filter. A single linear pass; no sorting.
 */
export function partitionFields(
  sortedFields: DataViewField[] | null,
  columns: string[],
  fieldCounts: Record<string, number>,
  fieldFilterState: FieldFilterState,
  showFacetedFields: boolean = false
): GroupedFields {
  const result: GroupedFields = {
    facetedFields: [],
    selectedFields: [],
    queryFields: [],
    discoveredFields: [],
  };
  if (!Array.isArray(sortedFields) || typeof fieldCounts !== 'object') {
    return result;
  }

  const selected = new Set(columns);
  for (const field of sortedFields) {
    if (!isFieldFiltered(field, fieldFilterState, fieldCounts) || field.type === '_source') {
      continue;
    }
    // Skip multi-fields (e.g. `.keyword` sub-fields of a `text` field). Their values live under
    // the parent field in `_source`, so they can never be resolved for the results grid and would
    // always render as null if added as a column.
    if (field.subType?.multi) {
      continue;
    }
    if (showFacetedFields && isFacetedField(field.name)) {
      result.facetedFields.push(field);
    }
    if (selected.has(field.name)) {
      result.selectedFields.push(field);
    } else if (field.name in fieldCounts) {
      result.queryFields.push(field);
    } else {
      result.discoveredFields.push(field);
    }
  }

  return result;
}

/**
 * Sort, then group the fields into selected, query and discovered, filtered by fieldFilterState.
 * Prefer `sortFields` + `partitionFields` when the sort can be memoized separately.
 */
export function groupFields(
  fields: DataViewField[] | null,
  columns: string[],
  fieldCounts: Record<string, number>,
  fieldFilterState: FieldFilterState,
  showFacetedFields: boolean = false
): GroupedFields {
  if (!Array.isArray(fields)) {
    return partitionFields(null, columns, fieldCounts, fieldFilterState, showFacetedFields);
  }
  return partitionFields(
    sortFields(fields),
    columns,
    fieldCounts,
    fieldFilterState,
    showFacetedFields
  );
}
