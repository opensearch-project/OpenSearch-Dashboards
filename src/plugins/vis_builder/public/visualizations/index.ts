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

export function registerDefaultTypes(typeServiceSetup: TypeServiceSetup, useVega: boolean) {
  const defaultVisualizationTypes = [
    createHistogramConfig,
    createLineConfig,
    createAreaConfig,
    createMetricConfig,
    createTableConfig,
  ];

  const visualizationTypes = useVega
    ? [...defaultVisualizationTypes, createPieConfig]
    : defaultVisualizationTypes;

  visualizationTypes.forEach((createTypeConfig) => {
    typeServiceSetup.createVisualizationType(createTypeConfig());
  });
}
