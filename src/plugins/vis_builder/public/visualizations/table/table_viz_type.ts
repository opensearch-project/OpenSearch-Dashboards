/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Schemas } from '../../../../vis_default_editor/public';
import { AggGroupNames } from '../../../../data/public';
import { TableVizOptions } from './components/table_viz_options';
import { VisualizationTypeOptions } from '../../services/type_service';
import { toExpression } from './to_expression';

export interface TableOptionsDefaults {
  perPage: number | '';
  showPartialRows: boolean;
  showMetricsAtAllLevels: boolean;
}

export const createTableConfig = (): VisualizationTypeOptions<TableOptionsDefaults> => ({
  name: 'table',
  title: 'Table',
  icon: 'visTable',
  description: 'Display table visualizations',
  toExpression,
  ui: {
    containerConfig: {
      data: {
        schemas: new Schemas([
          {
            group: AggGroupNames.Metrics,
            name: 'metric',
            title: i18n.translate('visTypeTableNewNew.tableVisEditorConfig.schemas.metricTitle', {
              defaultMessage: 'Metric',
            }),
            min: 1,
            aggFilter: ['!geo_centroid', '!geo_bounds'],
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
            name: 'bucket',
            title: i18n.translate('visTypeTableNewNew.tableVisEditorConfig.schemas.bucketTitle', {
              defaultMessage: 'Split rows',
            }),
            aggFilter: ['!filter'],
            defaults: {
              aggTypes: ['terms'],
            },
          },
          {
            group: AggGroupNames.Buckets,
            name: 'split_row',
            title: i18n.translate('visTypeTableNewNew.tableVisEditorConfig.schemas.splitTitle', {
              defaultMessage: 'Split table in rows',
            }),
            min: 0,
            max: 1,
            aggFilter: ['!filter'],
            defaults: {
              aggTypes: ['terms'],
            },
          },
          {
            group: AggGroupNames.Buckets,
            name: 'split_column',
            title: i18n.translate('visTypeTableNewNew.tableVisEditorConfig.schemas.splitTitle', {
              defaultMessage: 'Split table in columns',
            }),
            min: 0,
            max: 1,
            aggFilter: ['!filter'],
            defaults: {
              aggTypes: ['terms'],
            },
          },
        ]),
      },
      style: {
        defaults: {
          perPage: 10,
          showPartialRows: false,
          showMetricsAtAllLevels: false,
        },
        render: TableVizOptions,
      },
    },
  },
});
