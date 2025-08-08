/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import { AxisColumnMappings, VisColumn, VisFieldType } from './types';

export const convertMappingsToStrings = (mappings: AxisColumnMappings): Record<string, string> =>
  Object.fromEntries(Object.entries(mappings).map(([axis, column]) => [axis, column?.name]));

export const convertStringsToMappings = (
  stringMappings: Partial<Record<string, string>>,
  allColumns: VisColumn[]
): AxisColumnMappings =>
  Object.fromEntries(
    Object.entries(stringMappings).map(([axis, columnName]) => [
      axis,
      allColumns.find((col) => col.name === columnName),
    ])
  );

export const isValidMapping = (
  selectedAxesMapping: Partial<Record<string, string>>,
  allColumns: VisColumn[]
) =>
  Object.values(selectedAxesMapping).every((columnName) =>
    allColumns.some((col) => col.name === columnName)
  );

export const findRuleByIndex = (
  selectedAxesMapping: Partial<Record<string, string>>,
  allColumns: VisColumn[]
) => {
  const counts = {
    [VisFieldType.Categorical]: 0,
    [VisFieldType.Numerical]: 0,
    [VisFieldType.Date]: 0,
  };
  Object.values(selectedAxesMapping).forEach((columnName) => {
    const column = allColumns.find((col) => col.name === columnName);
    if (column?.schema! in counts) {
      counts[column?.schema as keyof typeof counts]++;
    }
  });
  const index = [counts.numerical, counts.categorical, counts.date];
  return ALL_VISUALIZATION_RULES.find((rule) => isEqual(rule.matchIndex, index));
};

export const getColumnMatchFromMapping = (
  mapping: Record<string, { type: VisFieldType; index: number }>
): number[] => {
  const counts = {
    [VisFieldType.Numerical]: 0,
    [VisFieldType.Categorical]: 0,
    [VisFieldType.Date]: 0,
    [VisFieldType.Unknown]: 0,
  };
  Object.values(mapping).forEach(({ type }) => {
    if (type in counts) counts[type]++;
  });
  return [
    counts[VisFieldType.Numerical],
    counts[VisFieldType.Categorical],
    counts[VisFieldType.Date],
  ];
};
