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
  'attributes.service.name',
  'attributes.aws.local.service',
  'serviceName',
  'attributes.http.status_code',
  'status.code',
] as const;

function isFacetedField(fieldName: string): fieldName is typeof FACET_FIELDS[number] {
  // Remove invisiable char
  const normalizedFieldName = fieldName.replace(/[\u200b-\u200f\uFEFF]/g, '');
  return (FACET_FIELDS as readonly string[]).includes(normalizedFieldName);
}

interface GroupedFields {
  facetedFields: DataViewField[];
  selectedFields: DataViewField[];
  queryFields: DataViewField[];
  discoveredFields: DataViewField[];
}

/**
 * group the fields into selected, popular and unpopular, filter by fieldFilterState
 */
export function groupFields(
  fields: DataViewField[] | null,
  columns: string[],
  fieldCounts: Record<string, number>,
  fieldFilterState: FieldFilterState
): GroupedFields {
  const result: GroupedFields = {
    facetedFields: [],
    selectedFields: [],
    queryFields: [],
    discoveredFields: [],
  };
  if (!Array.isArray(fields) || typeof fieldCounts !== 'object') {
    return result;
  }

  // fields are not regular JS array but a custom class extending native array and it breaks native array method (e.g. filter())
  // Convert FldList to proper Array for filtering to work correctly
  // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/d7004dc5b0392477fdd54ac66b29d231975a173b/src/plugins/data/common/index_patterns/fields/field_list.ts
  const fieldsArray = Array.from(fields);

  const compareFn = (a: DataViewField, b: DataViewField) => {
    if (!a.displayName) {
      return 0;
    }
    return a.displayName.localeCompare(b.displayName || '');
  };
  const fieldsSorted = fieldsArray.sort(compareFn);

  for (const field of fieldsSorted) {
    if (!isFieldFiltered(field, fieldFilterState, fieldCounts) || field.type === '_source') {
      continue;
    }
    if (isFacetedField(field.name)) {
      result.facetedFields.push(field);
    }
    if (columns.includes(field.name)) {
      result.selectedFields.push(field);
    } else if (field.name in fieldCounts) {
      result.queryFields.push(field);
    } else {
      result.discoveredFields.push(field);
    }
  }

  return result;
}
