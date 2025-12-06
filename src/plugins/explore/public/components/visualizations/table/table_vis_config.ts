/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { TableVisStyleControls } from './table_vis_options';
import {
  CellAlignment,
  ColorMode,
  Threshold,
  ColorModeOption,
  ValueMappingOptions,
} from '../types';
import { CalculationMethod } from '../utils/calculation';
import { DataLink } from './data_link_options';

export interface CellTypeConfig {
  field: string;
  type: ColorMode;
}

export interface Calc {
  fields: string[];
  calculation: CalculationMethod;
}

export interface TableChartStyleOptions {
  pageSize?: number;
  globalAlignment?: CellAlignment;
  showColumnFilter?: boolean;
  showFooter?: boolean;
  footerCalculations?: Calc[];
  cellTypes?: CellTypeConfig[];
  // TODO deprecate it and use thresholdOptions instead
  thresholds?: Threshold[];
  baseColor?: string;
  dataLinks?: DataLink[];
  visibleColumns?: string[];
  hiddenColumns?: string[];
  colorModeOption?: ColorModeOption;
  valueMappingOptions?: ValueMappingOptions;
}

export type TableChartStyle = Required<TableChartStyleOptions>;

export const defaultTableChartStyles: TableChartStyle = {
  pageSize: 10,
  globalAlignment: 'left',
  showColumnFilter: false,
  showFooter: false,
  footerCalculations: [],
  cellTypes: [],
  thresholds: [],
  baseColor: '#000000',
  dataLinks: [],
  visibleColumns: [],
  hiddenColumns: [],
  colorModeOption: 'none',
  valueMappingOptions: {
    valueMappings: [],
  },
};

export const createTableConfig = (): VisualizationType<'table'> => ({
  name: 'table',
  type: 'table',
  ui: {
    style: {
      defaults: defaultTableChartStyles,
      render: (props) => React.createElement(TableVisStyleControls, props),
    },
    availableMappings: [],
  },
});
