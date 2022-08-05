/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigSchema, configSchema } from '../config';
import { WizardPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as the OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WizardPlugin(initializerContext);
}

export { WizardPluginSetup, WizardPluginStart } from './types';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    enabled: true,
  },
  schema: configSchema,
};
