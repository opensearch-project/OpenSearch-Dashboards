/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TypeServiceSetup } from '../services/type_service';
import { createMetricConfig } from './metric';
import { createTableConfig } from './table';
import {
  createHistogramConfig,
  createLineConfig,
  createAreaConfig,
  createPieConfig,
} from './vislib';
import { VisualizationTypeOptions } from '../services/type_service';
import {
  HistogramOptionsDefaults,
  LineOptionsDefaults,
  AreaOptionsDefaults,
  PieOptionsDefaults,
} from './vislib';
import { MetricOptionsDefaults } from './metric/metric_viz_type';
import { TableOptionsDefaults } from './table/table_viz_type';

type VisualizationConfigFunction =
  | (() => VisualizationTypeOptions<HistogramOptionsDefaults>)
  | (() => VisualizationTypeOptions<LineOptionsDefaults>)
  | (() => VisualizationTypeOptions<AreaOptionsDefaults>)
  | (() => VisualizationTypeOptions<MetricOptionsDefaults>)
  | (() => VisualizationTypeOptions<TableOptionsDefaults>)
  | (() => VisualizationTypeOptions<PieOptionsDefaults>);

export function registerDefaultTypes(typeServiceSetup: TypeServiceSetup, useVega: boolean) {
  const visualizationTypes: VisualizationConfigFunction[] = [
    createHistogramConfig,
    createLineConfig,
    createAreaConfig,
    createMetricConfig,
    createTableConfig,
  ];

  if (useVega) visualizationTypes.push(createPieConfig);

  visualizationTypes.forEach((createTypeConfig) => {
    typeServiceSetup.createVisualizationType(createTypeConfig());
  });
}
