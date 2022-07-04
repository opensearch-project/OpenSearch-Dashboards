/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TypeServiceSetup } from '../services/type_service';
import { createMetricConfig } from './metric';
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
