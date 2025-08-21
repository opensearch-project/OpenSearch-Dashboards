/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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

export const getColumnsByAxesMapping = (
  selectedAxesMapping: Partial<Record<string, string>>,
  allColumns: VisColumn[]
) => {
  const numericalColumns: VisColumn[] = [];
  const categoricalColumns: VisColumn[] = [];
  const dateColumns: VisColumn[] = [];
  Object.values(selectedAxesMapping).forEach((fieldName) => {
    const column = allColumns.find((c) => c.name === fieldName);
    if (column?.schema === VisFieldType.Numerical) {
      numericalColumns.push(column);
    }
    if (column?.schema === VisFieldType.Categorical) {
      categoricalColumns.push(column);
    }
    if (column?.schema === VisFieldType.Date) {
      dateColumns.push(column);
    }
  });
  return { numericalColumns, categoricalColumns, dateColumns };
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
