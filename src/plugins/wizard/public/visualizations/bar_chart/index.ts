/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationTypeOptions } from '../../services/type_service/visualization_type';

export const createBarChartConfig = (): VisualizationTypeOptions => {
  return {
    name: 'bar_chart',
    title: 'Bar Chart',
    icon: 'visBarVertical',
    description: 'This is a bar chart',
    contributions: {},
  };
};
