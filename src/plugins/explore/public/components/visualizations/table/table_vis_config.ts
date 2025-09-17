/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { TableVisStyleControls } from './table_vis_options';
import { CellAlignment, ColorMode, Threshold } from '../types';
import { CalculationMethod } from '../utils/calculation';

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
  thresholds?: Threshold[];
  baseColor?: string;
}

export type TableChartStyle = Required<TableChartStyleOptions>;

export const defaultTableChartStyles: TableChartStyle = {
  pageSize: 10,
  globalAlignment: 'auto',
  showColumnFilter: false,
  showFooter: false,
  footerCalculations: [],
  cellTypes: [],
  thresholds: [],
  baseColor: '#000000',
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
