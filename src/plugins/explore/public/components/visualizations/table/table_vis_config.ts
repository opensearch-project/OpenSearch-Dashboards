/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { TableVisStyleControls } from './table_vis_options';
import { Threshold } from '../types';
import { CalculationMethod } from '../utils/calculation';

export interface TableChartStyleControls {
  pageSize: number;
  globalAlignment?: 'auto' | 'left' | 'center' | 'right';
  showColumnFilter?: boolean;
  showFooter?: boolean;
  footerCalculations?: Array<{
    fields: string[];
    calculation: CalculationMethod;
  }>;
  cellType?: 'auto' | 'colored_text' | 'colored_background';
  thresholds?: Threshold[];
  baseColor?: string;
}

const defaultTableChartStyles: TableChartStyleControls = {
  pageSize: 10,
  globalAlignment: 'auto',
  showColumnFilter: false,
  showFooter: false,
  footerCalculations: [],
  cellType: 'auto',
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
