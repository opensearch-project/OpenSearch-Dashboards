/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationTypeOptions } from '../../services/type_service/visualization_type';

export const createPieChartConfig = (): VisualizationTypeOptions => {
  return {
    name: 'pie_chart',
    title: 'Pie Chart',
    icon: 'visPie',
    contributions: {},
  };
};
