/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { IndexPattern, IndexPatternField } from '../../../../../../data/public';
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
  // For multi-value fields, we want to flatten based on the parent name instead
  const name = field.subType?.multi?.parent ?? field.name;
  const flattenHit = indexPattern.flattenHit;
  return hits.map((hit) => flattenHit(hit)[name]);
};

const getFieldValueCounts = (params: FieldValueCountsParams): FieldValueCounts => {
  const { hits, field, indexPattern, count = 5, grouped = false } = params;
  const { type: fieldType } = field;

  if (NO_ANALYSIS_TYPES.includes(fieldType)) {
    return {
      error: i18n.translate(
        'visBuilder.fieldChooser.fieldCalculator.analysisIsNotAvailableForGeoFieldsErrorMessage',
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
          'visBuilder.fieldChooser.fieldCalculator.fieldIsNotPresentInDocumentsErrorMessage',
          {
            defaultMessage:
              'This field is present in your OpenSearch mapping but not in the {hitsLength} documents sampled. You may still be able to visualize it.',
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
            'visBuilder.fieldChooser.fieldCalculator.analysisIsNotAvailableForObjectFieldsErrorMessage',
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
