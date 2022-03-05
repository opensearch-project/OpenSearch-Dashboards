/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemTypes } from '../../application/contributions/constants';
import {
  CONTAINER_ID as CONFIG_PANEL_ID,
  DropboxContribution,
  MainItemContribution as ConfigPanelItem,
} from '../../application/contributions/containers/config_panel';
import { VisualizationTypeOptions } from '../../services/type_service/visualization_type';

export const createBarChartConfig = (): VisualizationTypeOptions => {
  const configPanelItems: ConfigPanelItem[] = [
    {
      type: ItemTypes.TITLE,
      title: 'Bar Chart Configuration',
    },
    createDropboxContribution('x_axis', 'X Axis'),
    createDropboxContribution('y_axis', 'Y Axis', { limit: 2 }),
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

const createDropboxContribution = (
  id: string,
  label: string,
  props?: Pick<DropboxContribution, 'limit'>
): DropboxContribution => ({
  type: ItemTypes.DROPBOX,
  id,
  label,
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
    },
    {
      type: ItemTypes.INPUT,
      id: 'label',
      label: 'Name',
    },
  ],
  display: (indexField, dropboxState) => {
    const dropboxField = {
      id: indexField.name,
      icon: indexField.type,
      label: indexField.displayName,
    };
    if (dropboxState.fields[indexField.name]?.label) {
      dropboxField.label = dropboxState.fields[indexField.name].label;
    }

    return dropboxField;
  },
  onDrop: (indexField, initialValue) => {
    if (initialValue) return initialValue;

    return {
      label: indexField.displayName,
    };
  },
  ...props,
});
