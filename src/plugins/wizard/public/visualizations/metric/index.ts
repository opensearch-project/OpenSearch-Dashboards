/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { isEmpty } from 'lodash';
import { Schemas } from 'src/plugins/vis_default_editor/public';
import { i18n } from 'packages/osd-i18n';
import { AggGroupNames, DataPublicPluginStart, METRIC_TYPES } from '../../../../data/public';
import { ItemTypes } from '../../application/contributions/constants';
import {
  DATA_TAB_ID,
  DropboxContribution,
  DropboxState,
  MainItemContribution as ConfigPanelItem,
} from '../../application/contributions';
import { VisualizationTypeOptions } from '../../services/type_service';
import { WizardPluginStartDependencies } from '../../types';
import { toExpression } from './to_expression';
import { ColorModes, ColorSchemas } from '../../../../charts/public';
import { MetricVizOptions } from './components/metric_viz_options';

export const createMetricConfig = (
  pluginsStart: WizardPluginStartDependencies
): VisualizationTypeOptions => {
  const { data } = pluginsStart;
  const configPanelItems: ConfigPanelItem[] = [
    createDropboxContribution('metric', 'Metric', { data }, { limit: 3 }),
  ];

  return {
    name: 'metric',
    title: 'Metric',
    icon: 'visMetric',
    description: 'Display metric visualizations',
    contributions: {
      items: {
        [DATA_TAB_ID]: configPanelItems,
      },
    },
    toExpression: (state) => {
      const {
        config: { items },
        dataSource: { indexPattern },
      } = state;

      const metricFields = (items?.metric as DropboxState)?.instances;

      if (!indexPattern || isEmpty(metricFields)) return;

      const aggs = metricFields.map(({ properties }) => ({
        type: properties.aggregation,
        schema: 'metric',
        params: {
          field: properties.fieldName,
        },
      }));

      const aggConfigs = data.search.aggs.createAggConfigs(indexPattern, aggs);
      const expression = toExpression(aggConfigs);

      return expression;
    },
  };
};

const createDropboxContribution = (
  id: string,
  label: string,
  services: {
    data: DataPublicPluginStart;
  },
  props?: Pick<DropboxContribution, 'limit'>
): DropboxContribution => ({
  type: ItemTypes.DROPBOX,
  id,
  label,
  items: [
    {
      type: ItemTypes.SELECT,
      id: 'aggregation',
      label: 'Select a Function',
      options: (state) => {
        const { metrics } = services.data.search.aggs.types.getAll();
        return metrics.map(({ name, title, type }) => ({
          value: name,
          inputDisplay: title,
        }));
      },
    },
    {
      type: ItemTypes.INPUT,
      id: 'label',
      label: 'Name',
    },
  ],
  display: (indexField, dropboxState) => {
    const dropboxField = {
      icon: indexField.type,
      label: indexField.displayName,
    };

    if (dropboxState?.label) {
      dropboxField.label = dropboxState.label;
    }

    return dropboxField;
  },
  onDrop: (indexField) => {
    return {
      aggregation: METRIC_TYPES.COUNT,
      label: indexField.displayName, // TODO: Should make use of agg.makeLabel
    };
  },
  isDroppable: (indexField) => {
    return indexField.type === 'number';
  },
  ...props,
});

const MetricVizType = {
  name: 'metric',
  title: 'Metric',
  icon: 'visMetric',
  description: 'Display metric visualizations',
  toExpression: () => {},
  ui: {
    containerConfig: {
      Style: {
        defaultState: {
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
      Data: {
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
            defaults: [
              {
                type: 'count',
                schema: 'metric',
              },
            ],
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
          },
        ]),
      },
    },
  },
};
