/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemTypes } from '../../application/contributions/constants';
import {
  CONTAINER_ID as CONFIG_PANEL_ID,
  MainItemContribution as ConfigPanelItem,
} from '../../application/contributions/containers/config_panel';
import { VisualizationTypeOptions } from '../../services/type_service/visualization_type';

export const createBarChartConfig = (): VisualizationTypeOptions => {
  const configPanelItems: ConfigPanelItem[] = [
    {
      type: ItemTypes.TITLE,
      title: 'Bar Chart Configuration',
    },
    {
      type: ItemTypes.DROPBOX,
      id: 'x_axis',
      label: 'X Axis',
      items: [
        {
          type: ItemTypes.SELECT,
          id: 'field',
          label: 'Select a Field',
          options: (state) => {
            return state.dataSource.visualizableFields.map((field) => ({
              value: field.name,
              inputDisplay: field.displayName,
            }));
          },
          init: (props) => {},
        },
        {
          type: ItemTypes.SELECT,
          id: 'aggregation',
          label: 'Select a Function',
          options: (state, services) => {
            const { config } = state;
            // config.items[]
            const { buckets } = services.data.search.aggs.types.getAll();
            return buckets.map(({ name, title, type }) => ({
              value: name,
              inputDisplay: title,
            }));
          },
          init: (props) => {},
        },
        {
          type: ItemTypes.INPUT,
          id: 'label',
          label: 'Name',
          init: () => {},
        },
      ],
    },
    {
      type: ItemTypes.DROPBOX,
      id: 'y_axis',
      label: 'Y Axis',
      limit: 2,
      items: [],
    },
  ];

  return {
    name: 'bar_chart',
    title: 'Bar Chart',
    icon: 'visBarVertical',
    description: 'This is a bar chart',
    contributions: {
      items: {
        [CONFIG_PANEL_ID]: configPanelItems,
      },
    },
  };
};
