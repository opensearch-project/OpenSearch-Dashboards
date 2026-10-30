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

import { DataView, DataViewField } from '../../../../../data/public';

/**
 * Fields present in the current hits (`fieldCounts`) but absent from the index pattern, e.g.
 * keys under an `enabled: false` object. They are surfaced in the sidebar as `unknown` type.
 */
export function getUnknownFieldList(
  dataSet?: DataView,
  fieldCounts?: Record<string, number>
): DataViewField[] {
  if (!dataSet || !fieldCounts) return [];

  const fieldNamesInDocs = Object.keys(fieldCounts);
  if (fieldNamesInDocs.length === 0) return [];
  const unknownTypes: DataViewField[] = [];

  fieldNamesInDocs.forEach((fieldName) => {
    if (dataSet.fields.getByName(fieldName)) return;
    unknownTypes.push({
      displayName: String(fieldName),
      name: String(fieldName),
      type: 'unknown',
    } as DataViewField);
  });

  return unknownTypes;
}

export function getIndexPatternFieldList(dataSet?: DataView, fieldCounts?: Record<string, number>) {
  if (!dataSet || !fieldCounts) return [];

  return [...dataSet.fields.getAll(), ...getUnknownFieldList(dataSet, fieldCounts)];
}
