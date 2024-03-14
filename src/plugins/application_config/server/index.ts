/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ApplicationConfigSchema, configSchema } from '../config';
import { ApplicationConfigPlugin } from './plugin';

/*
This exports static code and TypeScript types,
as well as, OpenSearch Dashboards Platform `plugin()` initializer.
*/

export const config: PluginConfigDescriptor<ApplicationConfigSchema> = {
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new ApplicationConfigPlugin(initializerContext);
}

export {
  ApplicationConfigPluginSetup,
  ApplicationConfigPluginStart,
  ConfigurationClient,
} from './types';
