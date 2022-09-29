/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Schemas } from '../../../../../vis_default_editor/public';
import { Positions } from '../../../../../vis_type_vislib/public';
import { AggGroupNames } from '../../../../../data/public';
import { BasicOptionsDefaults } from '../common/types';
import { HistogramVisOptions } from './components/histogram_vis_options';
import { VisualizationTypeOptions } from '../../../services/type_service';
import { toExpression } from './to_expression';

export interface HistogramOptionsDefaults extends BasicOptionsDefaults {
  type: 'histogram';
}

export const createHistogramConfig = (): VisualizationTypeOptions<HistogramOptionsDefaults> => ({
  name: 'histogram',
  title: 'Bar',
  icon: 'visBarVertical',
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
            max: 3,
            aggFilter: ['!geo_centroid', '!geo_bounds'],
            defaults: { aggTypes: ['median'] },
          },
          {
            group: AggGroupNames.Buckets,
            name: 'segment',
            title: i18n.translate('visTypeVislib.histogram.segmentTitle', {
              defaultMessage: 'X-axis',
            }),
            min: 0,
            max: 1,
            aggFilter: ['!geohash_grid', '!geotile_grid', '!filter', '!filters'],
            defaults: { aggTypes: ['terms'] },
          },
        ]),
      },
      style: {
        defaults: {
          addTooltip: true,
          addLegend: true,
          legendPosition: Positions.RIGHT,
          type: 'histogram',
        },
        render: HistogramVisOptions,
      },
    },
  },
});
