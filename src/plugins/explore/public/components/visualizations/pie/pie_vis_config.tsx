/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';

import { PieVisStyleControls } from './pie_vis_options';
import { AxisRole, Positions, TitleOptions, TooltipOptions, VisFieldType } from '../types';
import { createPieSpec } from './to_expression';
import { EchartsRender } from '../echarts_render';

export interface PieExclusiveStyleOptions {
  donut?: boolean;
  showValues?: boolean;
  showLabels?: boolean;
  truncate?: number;
  // Todo:  shall we support 2 layers pie chart?
  showTopLevelOnly?: boolean;
}

export interface PieChartStyleOptions {
  // Basic controls
  addTooltip?: boolean;
  addLegend?: boolean;
  legendPosition?: Positions;
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;
  tooltipOptions?: TooltipOptions;

  // Exclusive controls
  exclusive?: PieExclusiveStyleOptions;

  titleOptions?: TitleOptions;
}

export type PieChartStyle = Required<Omit<PieChartStyleOptions, 'legendTitle'>> &
  Pick<PieChartStyleOptions, 'legendTitle'>;

export const defaultPieChartStyles: PieChartStyle = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.BOTTOM,
  legendTitle: '',
  tooltipOptions: {
    mode: 'all',
  },
  exclusive: {
    donut: true,
    showValues: false,
    showLabels: false,
    truncate: 100,
  },
  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createPieConfig = (): VisualizationType<'pie'> => ({
  name: 'Pie',
  icon: 'visPie',
  type: 'pie',
  getRules: () => {
    const rules: Array<VisRule<'pie'>> = [
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.SIZE]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const size = props.axisColumnMappings.size?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!size || !color) throw Error('Missing axis config for pie chart');
          const spec = createPieSpec(props.transformedData, props.styleOptions, {
            [AxisRole.SIZE]: size,
            [AxisRole.COLOR]: color,
          });
          return <EchartsRender spec={spec ?? {}} />;
        },
      },
      {
        priority: 40,
        mappings: [
          {
            [AxisRole.SIZE]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const size = props.axisColumnMappings.size?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!size || !color) throw Error('Missing axis config for pie chart');
          const spec = createPieSpec(props.transformedData, props.styleOptions, {
            [AxisRole.SIZE]: size,
            [AxisRole.COLOR]: color,
          });
          return <EchartsRender spec={spec ?? {}} />;
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultPieChartStyles,
      render: (props) => React.createElement(PieVisStyleControls, props),
    },
  },
});
