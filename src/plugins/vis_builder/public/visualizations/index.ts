/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TypeServiceSetup } from '../services/type_service';
import { createMetricConfig } from './metric';
import { createTableConfig } from './table';
import { createHistogramConfig, createLineConfig, createAreaConfig } from './vislib';

export function registerDefaultTypes(typeServiceSetup: TypeServiceSetup) {
  const visualizationTypes = [
    createHistogramConfig,
    createLineConfig,
    createAreaConfig,
    createMetricConfig,
    createTableConfig,
  ];

  visualizationTypes.forEach((createTypeConfig) => {
    typeServiceSetup.createVisualizationType(createTypeConfig());
  });
}
