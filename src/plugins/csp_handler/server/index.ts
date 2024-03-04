/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { CspHandlerConfigSchema, configSchema } from '../config';
import { CspHandlerPlugin } from './plugin';

/*
This exports static code and TypeScript types,
as well as, OpenSearch Dashboards Platform `plugin()` initializer.
*/
export const config: PluginConfigDescriptor<CspHandlerConfigSchema> = {
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new CspHandlerPlugin(initializerContext);
}

export { CspHandlerPluginSetup, CspHandlerPluginStart } from './types';
