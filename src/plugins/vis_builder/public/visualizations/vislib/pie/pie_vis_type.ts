/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Schemas } from '../../../../../vis_default_editor/public';
import { Positions } from '../../../../../vis_type_vislib/public';
import { AggGroupNames } from '../../../../../data/public';
import { PieVisOptions } from './components/pie_vis_options';
import { VisualizationTypeOptions } from '../../../services/type_service';
import { toExpression } from './to_expression';
import { BasicOptionsDefaults } from '../common/types';

export interface PieOptionsDefaults extends BasicOptionsDefaults {
  type: 'pie';
  isDonut: boolean;
  showMetricsAtAllLevels: boolean;
  labels: {
    show: boolean;
    values: boolean;
    last_level: boolean;
    truncate: number;
  };
}

export const createPieConfig = (): VisualizationTypeOptions<PieOptionsDefaults> => ({
  name: 'pie',
  title: 'Pie',
  icon: 'visPie',
  description: 'Display pie chart',
  toExpression,
  ui: {
    containerConfig: {
      data: {
        schemas: new Schemas([
          {
            group: AggGroupNames.Metrics,
            name: 'metric',
            title: i18n.translate('visBuilder.pie.metricTitle', {
              defaultMessage: 'Slice size',
            }),
            min: 1,
            max: 1,
            aggFilter: ['sum', 'count', 'cardinality', 'top_hits'],
            defaults: [{ schema: 'metric', type: 'count' }],
          },
          {
            group: AggGroupNames.Buckets,
            name: 'group',
            title: i18n.translate('visBuilder.pie.groupTitle', {
              defaultMessage: 'Split slices',
            }),
            min: 0,
            max: Infinity,
            aggFilter: ['!geohash_grid', '!geotile_grid', '!filter'],
            defaults: { aggTypes: ['terms'] },
          },
          {
            group: AggGroupNames.Buckets,
            name: 'split',
            title: i18n.translate('visBuilder.pie.splitTitle', {
              defaultMessage: 'Split chart',
            }),
            mustBeFirst: true,
            min: 0,
            max: 1,
            aggFilter: ['!geohash_grid', '!geotile_grid', '!filter'],
            defaults: { aggTypes: ['terms'] },
          },
        ]),
      },
      style: {
        defaults: {
          addTooltip: true,
          addLegend: true,
          legendPosition: Positions.RIGHT,
          isDonut: true,
          showMetricsAtAllLevels: true,
          type: 'pie',
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
        render: PieVisOptions,
      },
    },
  },
  hierarchicalData: true,
});
