/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { RangeValues, Schemas } from '../../../../vis_default_editor/public';
import { AggGroupNames } from '../../../../data/public';
import { ColorModes, ColorSchemas } from '../../../../charts/public';
import { MetricVizOptions } from './components/metric_viz_options';
import { VisualizationTypeOptions } from '../../services/type_service';
import { toExpression } from './to_expression';

export interface MetricOptionsDefaults {
  addTooltip: boolean;
  addLegend: boolean;
  type: 'metric';
  metric: {
    percentageMode: boolean;
    useRanges: boolean;
    colorSchema: ColorSchemas;
    metricColorMode: ColorModes;
    colorsRange: RangeValues[];
    labels: {
      show: boolean;
    };
    invertColors: boolean;
    style: {
      bgFill: string;
      bgColor: boolean;
      labelColor: boolean;
      subText: string;
      fontSize: number;
    };
  };
}

export const createMetricConfig = (): VisualizationTypeOptions<MetricOptionsDefaults> => ({
  name: 'metric',
  title: 'Metric',
  icon: 'visMetric',
  description: 'Display metric visualizations',
  toExpression,
  ui: {
    containerConfig: {
      data: {
        schemas: new Schemas([
          {
            group: AggGroupNames.Metrics,
            name: 'metric',
            title: i18n.translate('visTypeMetric.schemas.metricTitle', {
              defaultMessage: 'Metric',
            }),
            min: 1,
            aggFilter: [
              '!std_dev',
              '!geo_centroid',
              '!derivative',
              '!serial_diff',
              '!moving_avg',
              '!cumulative_sum',
              '!geo_bounds',
            ],
            aggSettings: {
              top_hits: {
                allowStrings: true,
              },
            },
            defaults: {
              aggTypes: ['avg', 'cardinality'],
            },
          },
          {
            group: AggGroupNames.Buckets,
            name: 'group',
            title: i18n.translate('visTypeMetric.schemas.splitGroupTitle', {
              defaultMessage: 'Split group',
            }),
            min: 0,
            max: 1,
            aggFilter: ['!geohash_grid', '!geotile_grid', '!filter'],
            defaults: {
              aggTypes: ['terms'],
            },
          },
        ]),
      },
      style: {
        defaults: {
          addTooltip: true,
          addLegend: false,
          type: 'metric',
          metric: {
            percentageMode: false,
            useRanges: false,
            colorSchema: ColorSchemas.GreenToRed,
            metricColorMode: ColorModes.NONE,
            colorsRange: [{ from: 0, to: 10000 }],
            labels: {
              show: true,
            },
            invertColors: false,
            style: {
              bgFill: '#000',
              bgColor: false,
              labelColor: false,
              subText: '',
              fontSize: 60,
            },
          },
        },
        render: MetricVizOptions,
      },
    },
  },
});
