/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TypeServiceSetup } from '../services/type_service';
import { createMetricConfig } from './metric';
import { createBarChartConfig } from './bar_chart';
import { createPieChartConfig } from './pie_chart';
import { WizardPluginStartDependencies } from '../types';

export function registerDefaultTypes(
  typeServiceSetup: TypeServiceSetup,
  pluginsStart: WizardPluginStartDependencies
) {
  const visualizationTypes = [createMetricConfig];

  visualizationTypes.forEach((createTypeConfig) => {
    typeServiceSetup.createVisualizationType(createTypeConfig());
  });
}
