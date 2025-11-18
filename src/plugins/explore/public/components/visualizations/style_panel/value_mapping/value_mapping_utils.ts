/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterOption, ValueMapping } from '../../types';
import { getCategoryNextColor, resolveColor } from '../../theme/color_utils';
import { DEFAULT_GREY } from '../../theme/default_colors';

export const decideScale = (
  filterOption: FilterOption | undefined,
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

  const keepNull = filterOption === 'filterButKeepOpposite';

  return {
    domain: keepNull ? [null, ...labels] : labels,
    range: keepNull ? [DEFAULT_GREY, ...colors] : colors,
  };
};

export const decideTransform = (filterOption: FilterOption | undefined) => {
  switch (filterOption) {
    case 'filterButKeepOpposite':
      return;
    case 'filterAll':
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
  filterOption: FilterOption | undefined
) => {
  if (!canUseValueMapping) return [];
  if (validRanges && validRanges?.length > 0 && validValues?.length === 0) {
    const rangeConditions = validRanges
      .map((mapping) => {
        // TODO support min to be -Infinity
        const min = mapping?.range?.min ?? -Infinity;
        const max = mapping?.range?.max ?? Infinity;

        const minCheck = `datum['${numericField}'] >= ${min}`;
        // drop max check if Infinity
        const maxCheck = Number.isFinite(max) ? ` && datum['${numericField}'] < ${max}` : '';

        const label = Number.isFinite(max) ? `[${min},${max})` : `[${min},∞)`;

        return `(${minCheck}${maxCheck}) ? '${label}' : `;
      })
      .join('');
    return [
      {
        calculate: `${rangeConditions}null`,
        as: 'mappingValue',
      },
      decideTransform(filterOption),
    ].filter(Boolean);
  }
  return [
    {
      lookup: numericField,
      from: {
        data: {
          values: validValues?.map((mapping) => ({
            mappingValue: mapping?.value,
            displayText: mapping?.displayText,
          })),
        },
        key: 'mappingValue',
        fields: ['mappingValue', 'displayText'],
      },
    },
    decideTransform(filterOption),
  ].filter(Boolean);
};

export const generateLabelExpr = (
  validRanges: ValueMapping[] | undefined,
  validValues: ValueMapping[] | undefined,
  filterOption: FilterOption
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

  if (filterOption === 'filterButKeepOpposite') {
    mappingObject = mappingObject + `, null: 'unmatched'`;
  }

  return `{${mappingObject}}[datum.label]`;
};
