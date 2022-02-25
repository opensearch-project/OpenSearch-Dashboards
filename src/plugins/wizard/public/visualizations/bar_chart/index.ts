/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CONTAINER_ID as CONFIG_PANEL_ID,
  ItemContribution as ConfigPanelItem,
} from '../../application/contributions/containers/config_panel/types';
import { VisualizationTypeOptions } from '../../services/type_service/visualization_type';

export const createBarChartConfig = (): VisualizationTypeOptions => {
  const configPanelItems: ConfigPanelItem[] = [
    {
      type: 'droppable_box',
      id: 'x_axis',
      label: 'X Axis',
    },
    {
      type: 'droppable_box',
      id: 'y_axis',
      label: 'Y Axis',
      limit: 2,
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
