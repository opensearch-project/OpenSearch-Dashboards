/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigSchema, configSchema } from '../config';
import { InternalPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new InternalPlugin(initializerContext);
}

export { InternalPluginSetup, InternalPluginStart } from './types';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  schema: configSchema,
};
