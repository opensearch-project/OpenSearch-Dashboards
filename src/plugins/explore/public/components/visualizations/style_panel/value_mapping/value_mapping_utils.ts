/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { ColorModeOption, ValueMapping, Threshold } from '../../types';
import { getCategoryNextColor, resolveColor } from '../../theme/color_utils';
import { DEFAULT_GREY } from '../../theme/default_colors';
import { CalculationMethod, calculateValue } from '../../utils/calculation';

export const decideScale = (
  colorModeOption: ColorModeOption | undefined,
  validRanges: ValueMapping[] | undefined,
  validValues: ValueMapping[] | undefined
) => {
  const usingRanges = validRanges && validRanges?.length > 0 && validValues?.length === 0;
  const items = usingRanges ? validRanges : validValues;

  if (!items || items.length === 0) return null;

  const labels = usingRanges
    ? items.map((m) => `[${m.range?.min},${m.range?.max ?? '∞'})`)
    : items.map((m) => m.value);

  const colors = items.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i));

  const keepNull = colorModeOption === 'highlightValueMapping';

  return {
    domain: keepNull ? [null, ...labels] : labels,
    range: keepNull ? [DEFAULT_GREY, ...colors] : colors,
  };
};

export const decideTransform = (colorModeOption: ColorModeOption | undefined) => {
  switch (colorModeOption) {
    case 'highlightValueMapping':
      return;
    case 'useValueMapping':
      return {
        filter: 'datum.mappingValue !== null',
      };
  }
};

export const generateTransformLayer = (
  canUseValueMapping: boolean | undefined,
  numericField: string | undefined,
  validRanges: ValueMapping[] | undefined,
  validValues: ValueMapping[] | undefined,
  colorModeOption: ColorModeOption | undefined
) => {
  if (!canUseValueMapping) return [];

  const useRangeMappings = validRanges && validRanges?.length > 0 && validValues?.length === 0;

  const valuesChoice = useRangeMappings
    ? validRanges?.map((mapping) => ({
        mappingValue: `[${mapping?.range?.min},${mapping?.range?.max ?? '∞'})`,
        displayText: mapping?.displayText,
      }))
    : validValues?.map((mapping) => ({
        mappingValue: mapping?.value,
        displayText: mapping?.displayText,
      }));
  return [
    {
      lookup: useRangeMappings ? 'mergedLabel' : numericField,
      from: {
        data: {
          values: valuesChoice,
        },
        key: 'mappingValue',
        fields: ['mappingValue', 'displayText'],
      },
    },
    decideTransform(colorModeOption),
  ].filter(Boolean);
};

export const generateLabelExpr = (
  validRanges: ValueMapping[] | undefined,
  validValues: ValueMapping[] | undefined,
  colorModeOption: ColorModeOption | undefined
) => {
  const usingRanges = validRanges && validRanges?.length > 0 && validValues?.length === 0;
  const items = usingRanges ? validRanges : validValues;

  if (!items || items.length === 0) return null;

  let mappingObject = items
    .map(
      (m) =>
        `'${usingRanges ? `[${m.range?.min},${m.range?.max ?? '∞'})` : m.value}': '${
          m.displayText
            ? m.displayText
            : usingRanges
            ? `[${m.range?.min},${m.range?.max ?? '∞'})`
            : m.value
        }'`
    )
    .join(', ');

  if (colorModeOption === 'highlightValueMapping') {
    mappingObject = mappingObject + `, null: 'unmatched'`;
  }

  return `{${mappingObject}}[datum.label] || datum.label`;
};

export const generateConditions = (
  validValues: ValueMapping[] | undefined,
  validRanges: ValueMapping[] | undefined,
  field: string | undefined
) => {
  const useRangeMappings = validRanges && validRanges?.length > 0 && validValues?.length === 0;

  const mappings = useRangeMappings ? validRanges : validValues;
  if (field) {
    const generateValue = (mapping: ValueMapping) => {
      return useRangeMappings
        ? `'[${mapping?.range?.min},${mapping?.range?.max ?? '∞'})'`
        : mapping.value;
    };

    return mappings?.map((v, i) => ({
      test: `datum['${field}']=== ${generateValue(v)}`,
      value: resolveColor(v.color) || getCategoryNextColor(i),
    }));
  }
};

export const processData = ({
  transformedData,
  categoricalColumn,
  numericalColumn,
  transformedCalculationMethod,
  valueMappings,
  rangeMappings,
  categoricalColumn2,
}: {
  transformedData: Array<Record<string, any>>;
  categoricalColumn: string | undefined;
  numericalColumn: string | undefined;
  transformedCalculationMethod: CalculationMethod | undefined;
  valueMappings: ValueMapping[] | undefined;
  rangeMappings: ValueMapping[] | undefined;
  categoricalColumn2?: string | undefined;
}) => {
  let newRecord = [];

  if (transformedCalculationMethod) {
    const groups = categoricalColumn
      ? groupBy(transformedData, (item) => {
          if (categoricalColumn2) {
            return [item[categoricalColumn], item[categoricalColumn2]].join('+');
          }
          return item[categoricalColumn];
        })
      : [];
    for (const g1 of Object.values(groups)) {
      if (numericalColumn) {
        const calculate = calculateValue(
          g1.map((d) => d[numericalColumn]),
          transformedCalculationMethod
        );
        const isValidNumber =
          calculate !== undefined && typeof calculate === 'number' && !isNaN(calculate);

        newRecord.push({
          ...g1[0],
          [numericalColumn]: isValidNumber ? calculate : null,
        });
      }
    }
  } else {
    newRecord = [...transformedData];
  }

  const numericalOptions = Array.from(new Set(newRecord.map((t) => t[numericalColumn!])));

  const categorical2Options = categoricalColumn2
    ? Array.from(new Set(newRecord.map((t) => t[categoricalColumn2!])))
    : null;

  const validValues = valueMappings?.filter((r) => {
    if (!r.value) return false;
    return numericalOptions.includes(Number(r.value));
  });

  const validRanges = new Set<ValueMapping>();

  newRecord = newRecord.map((record) => {
    const value = record[numericalColumn!];
    const matchingRange = rangeMappings?.find((r) => {
      if (!r.range || r.range?.min === undefined) return false;
      if (value && value >= r.range.min && value < (r.range.max ?? Infinity)) {
        validRanges.add(r);
        return true;
      }
      return false;
    });

    return {
      ...record,
      mergedLabel: matchingRange
        ? `[${matchingRange?.range?.min},${matchingRange?.range?.max ?? '∞'})`
        : null,
    };
  });

  return { newRecord, validValues, validRanges: Array.from(validRanges), categorical2Options };
};

export const convertThresholdsToValueMappings = (thresholds: Threshold[]): ValueMapping[] => {
  return thresholds.map((t, i) => ({
    type: 'range',
    range: {
      min: t.value,
      max: i === thresholds.length - 1 ? undefined : thresholds[i + 1].value,
    },
    color: t.color,
  }));
};
