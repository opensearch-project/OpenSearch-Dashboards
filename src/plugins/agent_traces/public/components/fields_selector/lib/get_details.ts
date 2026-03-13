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

// @ts-ignore
import { i18n } from '@osd/i18n';
import { getFieldValueCounts } from './field_calculator';
import { DataView, DataViewField } from '../../../../../data/public';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { AGENT_TRACES_VIRTUAL_COLUMN_SOURCE_FIELDS } from '../../../../common';

export function getDetails(
  field: DataViewField,
  hits: Array<OpenSearchSearchHit<Record<string, any>>>,
  dataSet?: DataView
) {
  const defaultDetails = {
    error: '',
    exists: 0,
    total: 0,
    buckets: [],
  };
  if (!dataSet) {
    return {
      ...defaultDetails,
      error: i18n.translate(
        'agentTraces.discover.fieldChooser.noIndexPatternSelectedErrorMessage',
        {
          defaultMessage: 'Data view not specified.',
        }
      ),
    };
  }

  // For virtual columns, resolve to the underlying source field so
  // flattenHit can find the values in the raw _source document.
  const sourceFieldName = AGENT_TRACES_VIRTUAL_COLUMN_SOURCE_FIELDS[field.name];
  const effectiveField = sourceFieldName
    ? new DataViewField({ ...field.spec, name: sourceFieldName }, field.displayName)
    : field;

  const details = {
    ...defaultDetails,
    ...getFieldValueCounts({
      hits,
      field: effectiveField,
      dataSet,
      count: 5,
      grouped: false,
    }),
  };
  if (details.buckets) {
    for (const bucket of details.buckets) {
      bucket.display = dataSet.getFormatterForField(effectiveField).convert(bucket.value);
    }
  }

  return details;
}
