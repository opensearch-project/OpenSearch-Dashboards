/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemTypes } from '../../application/contributions/constants';
import {
  DATA_TAB_ID,
  DropboxContribution,
  MainItemContribution as ConfigPanelItem,
} from '../../application/contributions';
import { VisualizationTypeOptions } from '../../services/type_service';

export const createBarChartConfig = (): VisualizationTypeOptions => {
  const configPanelItems: ConfigPanelItem[] = [
    {
      type: ItemTypes.TITLE,
      title: 'Bar Chart Configuration',
    },
    createDropboxContribution('x_axis', 'X Axis', {}),
    createDropboxContribution('y_axis', 'Y Axis', { limit: 5 }),
    // {
    //   type: ItemTypes.INPUT,
    //   id: 'testLabel',
    //   label: 'Test Label',
    // },
  ];

  return {
    name: 'bar_chart',
    title: 'Bar Chart',
    icon: 'visBarVertical',
    description: 'This is a bar chart',
    contributions: {
      items: {
        [DATA_TAB_ID]: configPanelItems,
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
      // label: indexField.displayName,
    };
  },
  // isDroppable: (indexField) => {
  //   return indexField.displayName === 'geo.srcdest';
  // },
  ...props,
});
