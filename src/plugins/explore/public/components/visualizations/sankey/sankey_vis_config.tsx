/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AxisRole, StandardOptions, TooltipOptions, VisFieldType } from '../types';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import { EchartsRender } from '../echarts_render';
import { createSankeySpec } from './to_expression';
import { SankeyVisStyleControls } from './sankey_vis_options';

export type SankeyOrientation = 'horizontal' | 'vertical';
export type SankeyLinkColor = 'source' | 'target' | 'gradient';

export interface SankeyLevelStyle {
  depth: number;
  color?: string;
  opacity?: number;
}

export interface SankeyExclusiveStyleOptions {
  orient: SankeyOrientation;
  nodeWidth: number;
  showNodeLabels: boolean;
  showLinkLabels: boolean;
  linkColor: SankeyLinkColor;
  linkOpacity: number;
  levels: SankeyLevelStyle[];
}

export interface SankeyChartStyleOptions extends StandardOptions {
  tooltipOptions?: TooltipOptions;
  exclusive?: SankeyExclusiveStyleOptions;
}

export type SankeyChartStyle = Required<
  Omit<SankeyChartStyleOptions, 'unitId' | 'unitSuffix' | 'decimals' | 'min' | 'max'>
> &
  Pick<SankeyChartStyleOptions, 'unitId' | 'unitSuffix' | 'decimals'>;

export const defaultSankeyChartStyles: SankeyChartStyle = {
  tooltipOptions: {
    mode: 'all',
  },
  exclusive: {
    orient: 'horizontal',
    nodeWidth: 20,
    showNodeLabels: true,
    showLinkLabels: false,
    linkColor: 'gradient',
    linkOpacity: 0.4,
    levels: [],
  },
};

export const createSankeyConfig = (): VisualizationType<'sankey'> => ({
  name: 'Sankey',
  type: 'sankey',
  icon: 'graphApp',
  getRules: () => {
    const rules: Array<VisRule<'sankey'>> = [
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.SOURCE]: { type: VisFieldType.Categorical },
            [AxisRole.TARGET]: { type: VisFieldType.Categorical },
            [AxisRole.Value]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const source = props.axisColumnMappings.source?.[0];
          const target = props.axisColumnMappings.target?.[0];
          const value = props.axisColumnMappings.value?.[0];

          if (!source || !target || !value) {
            throw Error('Missing field config for Sankey chart');
          }

          const spec = createSankeySpec(props.data, props.styleOptions, {
            [AxisRole.SOURCE]: source,
            [AxisRole.TARGET]: target,
            [AxisRole.Value]: value,
          });

          return <EchartsRender spec={spec ?? {}} />;
        },
      },
    ];

    return rules;
  },
  ui: {
    style: {
      defaults: defaultSankeyChartStyles,
      render: (props) => React.createElement(SankeyVisStyleControls, props),
    },
  },
});
