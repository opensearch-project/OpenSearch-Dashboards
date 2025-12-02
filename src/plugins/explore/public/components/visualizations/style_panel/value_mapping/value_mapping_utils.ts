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
  const items = [...(validValues ?? []), ...(validRanges ?? [])];
  if (items.length === 0) return null;

  const labels = [
    ...(validValues?.map((m) => m.value) ?? []),
    ...(validRanges?.map((m) => `[${m.range?.min},${m.range?.max ?? '∞'})`) ?? []),
  ];

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
  colorModeOption: ColorModeOption | undefined,
  lookupCategory = false
) => {
  if (!canUseValueMapping) return [];

  const rangeChoices = validRanges?.map((mapping) => ({
    mappingValue: `[${mapping?.range?.min},${mapping?.range?.max ?? '∞'})`,
    displayText: mapping?.displayText,
  }));

  const valueChoices = validValues?.map((mapping) => ({
    mappingValue: mapping?.value,
    displayText: mapping?.displayText,
  }));

  return [
    {
      lookup: !lookupCategory ? 'mergedLabel' : numericField,
      from: {
        data: {
          values: [...(valueChoices ?? []), ...(rangeChoices ?? [])],
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
  const items = [...(validValues ?? []), ...(validRanges ?? [])];
  if (items.length === 0) return null;

  const mappings = [
    ...(validValues?.map((m) => `'${m.value}': '${m.displayText || m.value}'`) ?? []),
    ...(validRanges?.map((m) => {
      const key = `[${m.range?.min},${m.range?.max ?? '∞'})`;
      return `'${key}': '${m.displayText || key}'`;
    }) ?? []),
  ];

  if (colorModeOption === 'highlightValueMapping') {
    mappings.push("null: 'unmatched'");
  }

  return `{${mappings.join(', ')}}[datum.label] || datum.label`;
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
    if (r.value === undefined || r.value === null) return false;
    return numericalOptions.includes(Number(r.value));
  });

  const validRanges = new Set<ValueMapping>();

  newRecord = newRecord.map((record) => {
    const value = record[numericalColumn!];
    const matchingValue = validValues?.find((r) => {
      if (value && value === Number(r.value)) {
        return true;
      }
      return false;
    });

    let matchingRange;
    if (!matchingValue) {
      matchingRange = rangeMappings?.find((r) => {
        if (!r.range || r.range?.min === undefined) return false;
        if (
          value !== null &&
          value !== undefined &&
          value >= r.range.min &&
          value < (r.range.max ?? Infinity)
        ) {
          validRanges.add(r);
          return true;
        }
        return false;
      });
    }

    const label = matchingValue
      ? matchingValue.value
      : matchingRange
      ? `[${matchingRange?.range?.min},${matchingRange?.range?.max ?? '∞'})`
      : null;

    return {
      ...record,
      mergedLabel: label,
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
