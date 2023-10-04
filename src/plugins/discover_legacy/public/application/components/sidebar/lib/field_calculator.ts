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

import { i18n } from '@osd/i18n';
import { IndexPattern, IndexPatternField } from 'src/plugins/data/public';
import { FieldValueCounts } from '../types';

const NO_ANALYSIS_TYPES = ['geo_point', 'geo_shape', 'attachment'];

interface FieldValuesParams {
  hits: Array<Record<string, unknown>>;
  field: IndexPatternField;
  indexPattern: IndexPattern;
}

interface FieldValueCountsParams extends FieldValuesParams {
  count?: number;
  grouped?: boolean;
}

const getFieldValues = ({ hits, field, indexPattern }: FieldValuesParams) => {
  const name = field.name;
  const flattenHit = indexPattern.flattenHit;
  return hits.map((hit) => flattenHit(hit)[name]);
};

const getFieldValueCounts = (params: FieldValueCountsParams): FieldValueCounts => {
  const { hits, field, indexPattern, count = 5, grouped = false } = params;
  const { type: fieldType } = field;

  if (NO_ANALYSIS_TYPES.includes(fieldType)) {
    return {
      error: i18n.translate(
        'discover.fieldChooser.fieldCalculator.analysisIsNotAvailableForGeoFieldsErrorMessage',
        {
          defaultMessage: 'Analysis is not available for {fieldType} fields.',
          values: {
            fieldType,
          },
        }
      ),
    };
  }

  const allValues = getFieldValues({ hits, field, indexPattern });
  const missing = allValues.filter((v) => v === undefined || v === null).length;

  try {
    const groups = groupValues(allValues, grouped);
    const counts = Object.keys(groups)
      .sort((a, b) => groups[b].count - groups[a].count)
      .slice(0, count)
      .map((key) => ({
        value: groups[key].value,
        count: groups[key].count,
        percent: (groups[key].count / (hits.length - missing)) * 100,
        display: indexPattern.getFormatterForField(field).convert(groups[key].value),
      }));

    if (hits.length === missing) {
      return {
        error: i18n.translate(
          'discover.fieldChooser.fieldCalculator.fieldIsNotPresentInDocumentsErrorMessage',
          {
            defaultMessage:
              'This field is present in your OpenSearch mapping but not in the {hitsLength} documents shown in the doc table. You may still be able to visualize or search on it.',
            values: {
              hitsLength: hits.length,
            },
          }
        ),
      };
    }

    return {
      total: hits.length,
      exists: hits.length - missing,
      missing,
      buckets: counts,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : String(e),
    };
  }
};

const groupValues = (
  allValues: any[],
  grouped?: boolean
): Record<string, { value: any; count: number }> => {
  const values = grouped ? allValues : allValues.flat();

  return values
    .filter((v) => {
      if (v instanceof Object && !Array.isArray(v)) {
        throw new Error(
          i18n.translate(
            'discover.fieldChooser.fieldCalculator.analysisIsNotAvailableForObjectFieldsErrorMessage',
            {
              defaultMessage: 'Analysis is not available for object fields.',
            }
          )
        );
      }
      return v !== undefined && v !== null;
    })
    .reduce((groups, value) => {
      if (groups.hasOwnProperty(value)) {
        groups[value].count++;
      } else {
        groups[value] = {
          value,
          count: 1,
        };
      }
      return groups;
    }, {});
};

export { FieldValueCountsParams, groupValues, getFieldValues, getFieldValueCounts };
