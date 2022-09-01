/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TypeServiceSetup } from '../services/type_service';
import { createMetricConfig } from './metric';
import { createHistogramConfig, createLineConfig } from './vislib';

export function registerDefaultTypes(typeServiceSetup: TypeServiceSetup) {
  const visualizationTypes = [createHistogramConfig, createLineConfig, createMetricConfig];

  visualizationTypes.forEach((createTypeConfig) => {
    typeServiceSetup.createVisualizationType(createTypeConfig());
  });
}
