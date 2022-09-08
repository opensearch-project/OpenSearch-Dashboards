/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Schemas } from '../../../../../vis_default_editor/public';
import { Positions } from '../../../../../vis_type_vislib/public';
import { AggGroupNames } from '../../../../../data/public';
import { LineVisOptions } from './components/line_vis_options';
import { VisualizationTypeOptions } from '../../../services/type_service';
import { toExpression } from './to_expression';
import { BasicOptionsDefaults } from '../common/types';

export interface LineOptionsDefaults extends BasicOptionsDefaults {
  type: 'line';
}

export const createLineConfig = (): VisualizationTypeOptions<LineOptionsDefaults> => ({
  name: 'line',
  title: 'Line',
  icon: 'visLine',
  description: 'Display line chart',
  toExpression,
  ui: {
    containerConfig: {
      data: {
        schemas: new Schemas([
          {
            group: AggGroupNames.Metrics,
            name: 'metric',
            title: i18n.translate('visTypeVislib.line.metricTitle', {
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
            title: i18n.translate('visTypeVislib.line.segmentTitle', {
              defaultMessage: 'X-axis',
            }),
            min: 0,
            max: 1,
            aggFilter: ['!geohash_grid', '!geotile_grid', '!filter', '!filters'],
            defaults: { aggTypes: ['terms'] },
          },
          {
            group: AggGroupNames.Metrics,
            name: 'radius',
            title: i18n.translate('visTypeVislib.line.radiusTitle', {
              defaultMessage: 'Dot size',
            }),
            min: 0,
            max: 1,
            aggFilter: ['count', 'avg', 'sum', 'min', 'max', 'cardinality'],
            defaults: { aggTypes: ['count'] },
          },
        ]),
      },
      style: {
        defaults: {
          addTooltip: true,
          addLegend: true,
          legendPosition: Positions.RIGHT,
          type: 'line',
        },
        render: LineVisOptions,
      },
    },
  },
});
