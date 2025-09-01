/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { TableVisStyleControls } from './table_vis_options';

export interface TableChartStyleControls {
  pageSize: number;
  globalAlignment?: 'auto' | 'left' | 'center' | 'right';
  showColumnFilter?: boolean;
}

const defaultTableChartStyles: TableChartStyleControls = {
  pageSize: 10,
  globalAlignment: 'auto',
  showColumnFilter: false,
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
