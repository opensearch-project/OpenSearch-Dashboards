/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import {
  setAxesMapping,
  setChartType,
  setStyleOptions,
} from '../../application/utils/state_management/slices';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import {
  AxisColumnMappings,
  VisColumn,
  VisFieldType,
  AxisWithStyle,
  AxisRole,
  Positions,
  CompleteAxisWithStyle,
} from './types';
import { ChartType, VisualizationTypeResult } from './utils/use_visualization_types';

export const convertMappingsToNameAndStyles = (
  mappings: AxisColumnMappings
): Partial<Record<string, AxisWithStyle>> => {
  return Object.fromEntries(
    Object.entries(mappings).map(([axis, column]) => [
      axis,
      { name: column.name, ...(column.styles ? { styles: column.styles } : {}) },
    ])
  );
};
export const convertStringsToMappings = (
  stringMappings: Partial<Record<string, AxisWithStyle>>,
  allColumns: VisColumn[]
): AxisColumnMappings =>
  Object.fromEntries(
    Object.entries(stringMappings).map(([axis, axisWithStyle]) => {
      if (!axisWithStyle) return [axis, undefined];
      const { name, styles } = axisWithStyle;
      const column = allColumns.find((col) => col.name === name);
      return [axis, column ? { ...column, ...(styles ? { styles } : {}) } : undefined];
    })
  );

export const getAllColumns = (visualizationTypeResult: VisualizationTypeResult<ChartType>) => [
  ...visualizationTypeResult.numericalColumns!,
  ...visualizationTypeResult.categoricalColumns!,
  ...visualizationTypeResult.dateColumns!,
];

export const isValidMapping = (
  selectedAxesMapping: Partial<Record<string, AxisWithStyle>>,
  allColumns: VisColumn[]
) =>
  Object.values(selectedAxesMapping).every((axis) =>
    allColumns.some((col) => col.name === axis?.name)
  );

export const updateMappingDetails = (
  axesMapping: AxisColumnMappings,
  columns: VisColumn[]
): AxisColumnMappings => {
  const updated: AxisColumnMappings = {};

  Object.entries(axesMapping).forEach(([key, axis]) => {
    const role = key as AxisRole;
    const column = columns.find((col) => col.name === axis.name);

    if (column) {
      updated[role] = {
        ...axis,
        column: column.column,
        id: column.id,
        uniqueValuesCount: column.uniqueValuesCount,
        validValuesCount: column.validValuesCount,
      };
    }
  });

  return updated;
};

export const applyDefaultVisualization = (
  visualizationTypeResult: VisualizationTypeResult<ChartType>,
  setCurrentRuleId: (id: string | undefined) => void,
  setVisualizationData: (data: VisualizationTypeResult<ChartType>) => void,
  dispatch: any
) => {
  setCurrentRuleId(visualizationTypeResult.ruleId);
  setVisualizationData(visualizationTypeResult);
  dispatch(setChartType(visualizationTypeResult.visualizationType!.type));
  dispatch(
    setAxesMapping(convertMappingsToNameAndStyles(visualizationTypeResult.axisColumnMappings!))
  );
  dispatch(setStyleOptions(visualizationTypeResult.visualizationType!.ui.style.defaults));
};

export const findRuleByIndex = (
  selectedAxesMapping: Partial<Record<string, AxisWithStyle>>,
  allColumns: VisColumn[]
) => {
  const counts = {
    [VisFieldType.Categorical]: 0,
    [VisFieldType.Numerical]: 0,
    [VisFieldType.Date]: 0,
  };
  Object.values(selectedAxesMapping).forEach((axis) => {
    const column = allColumns.find((col) => col.name === axis?.name);
    if (column?.schema! in counts) {
      counts[column?.schema as keyof typeof counts]++;
    }
  });
  const index = [counts.numerical, counts.categorical, counts.date];
  return ALL_VISUALIZATION_RULES.find((rule) => isEqual(rule.matchIndex, index));
};

export const getColumnMatchFromMapping = (
  mapping: Array<Record<string, { type: VisFieldType; index: number }>>
): number[] => {
  const counts = {
    [VisFieldType.Numerical]: 0,
    [VisFieldType.Categorical]: 0,
    [VisFieldType.Date]: 0,
    [VisFieldType.Unknown]: 0,
  };
  Object.values(mapping[0]).forEach(({ type }) => {
    if (type in counts) counts[type]++;
  });
  return [
    counts[VisFieldType.Numerical],
    counts[VisFieldType.Categorical],
    counts[VisFieldType.Date],
  ];
};

export const getDefaultAxisStyle = (axisRole: AxisRole): CompleteAxisWithStyle['styles'] => {
  let position: Positions;

  switch (axisRole) {
    case AxisRole.X:
      position = Positions.BOTTOM;
      break;
    case AxisRole.Y:
      position = Positions.LEFT;
      break;
    case AxisRole.Y_SECOND:
      position = Positions.RIGHT;
      break;
    default:
      return undefined; // Other roles (e.g., COLOR, SIZE) don't get axis styles}
  }

  return {
    show: true,
    style: {},
    labels: {
      show: true,
      rotate: 0,
      filter: false,
      truncate: 100,
    },
    title: {
      text: '',
    },
    position,
  };
};

export const applyDefaultAxisStyle = (
  selections: Partial<Record<AxisRole, CompleteAxisWithStyle>>
): AxisColumnMappings => {
  const updated: AxisColumnMappings = {};

  Object.entries(selections).forEach(([role, value]) => {
    if (!value) return;
    const axisRole = role as AxisRole;

    // if the axis already has styles, we don't apply default styles
    const alreadyHasStyles = !!value.styles;

    updated[axisRole] = {
      ...value,
      ...(alreadyHasStyles
        ? { styles: value.styles }
        : getDefaultAxisStyle(axisRole)
        ? { styles: getDefaultAxisStyle(axisRole) }
        : {}),
    };
  });

  return updated;
};

export function buildUpdatedAxisMapping(
  reusedMapping: Partial<
    Record<
      AxisRole,
      {
        type: VisFieldType;
        index: number;
      }
    >
  >,
  selectedAxesMapping: AxisColumnMappings,
  allColumns: VisColumn[]
): AxisColumnMappings {
  const usedColumns = new Set<string>();

  return Object.fromEntries(
    Object.entries(reusedMapping).map(([expectedRole, expectedSchema]) => {
      const axisRole = expectedRole as AxisRole;
      const selectedAxisWithRole = selectedAxesMapping[axisRole];

      // Step 1: Try to use column that is exactly matched
      // re-used the styles
      const preferredColumn = allColumns.find(
        (col) =>
          col.name === selectedAxisWithRole?.name &&
          col.schema === selectedAxisWithRole.schema &&
          expectedSchema.type === selectedAxisWithRole.schema &&
          !usedColumns.has(col.name)
      );
      if (preferredColumn) {
        usedColumns.add(preferredColumn.name);
        return [axisRole, { name: preferredColumn.name, styles: selectedAxisWithRole?.styles }];
      }

      // Step 2: column is here, but schema is not matching with mapping, find a column that matches schema and gives it a default style
      const matchingColumn = Object.values(selectedAxesMapping).find((axis) => {
        if (usedColumns.has(axis.name)) return false;
        const column = allColumns.find((col) => col.name === axis.name);
        return column?.schema === expectedSchema.type;
      });
      if (matchingColumn && !usedColumns.has(matchingColumn.name)) {
        usedColumns.add(matchingColumn.name);
        return [axisRole, { name: matchingColumn.name, styles: getDefaultAxisStyle(axisRole) }];
      }

      // Step 3: Nothing found
      return [axisRole, undefined];
    })
  );
}
