/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { RangeValues, Schemas } from '../../../../vis_default_editor/public';
import { AggGroupNames } from '../../../../data/public';
import { ColorModes, ColorSchemas } from '../../../../charts/public';
import { HistogramVisOptions } from './components/histogram_vis_options';
import { VisualizationTypeOptions } from '../../services/type_service';
import { toExpression } from './to_expression';

export interface HistogramOptionsDefaults {
  addTooltip: boolean;
  addLegend: boolean;
  type: 'histogram';
}

export const createHistogramConfig = (): VisualizationTypeOptions<HistogramOptionsDefaults> => ({
  name: 'histogram',
  title: 'Histogram',
  icon: 'visMetric',//todo
  description: 'Display histogram visualizations',
  toExpression,
  ui: {
    containerConfig: {
      data: {
        schemas: new Schemas([
          {
            group: AggGroupNames.Metrics,
            name: 'metric',
            title: i18n.translate('visTypeVislib.histogram.metricTitle', {
              defaultMessage: 'Y-axis',
            }),
            min: 1,
            max: 1,
            aggFilter: ['!geo_centroid', '!geo_bounds'],//'!geo_centroid', '!geo_bounds'
            defaults: [{ schema: 'metric', type: 'count' }]
          },
          {
            group: AggGroupNames.Buckets,
            name: 'segment',
            title: i18n.translate('visTypeVislib.histogram.segmentTitle', {
              defaultMessage: 'X-axis',
            }),
            min: 1,
            max: 1,
            aggFilter: [],//'!geohash_grid', '!geotile_grid', '!filter'
            defaults: {
              aggTypes: ['terms']
            }
          }
        ])
      },
      style: {
        defaults: {
          addTooltip: true,
          addLegend: false,
          type: 'histogram',
        },
        render: HistogramVisOptions,
      },
    },
  },
});
