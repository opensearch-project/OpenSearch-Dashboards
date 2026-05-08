/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ContextProviderServerPlugin } from './plugin';
import { configSchema, ContextProviderConfigType } from './config';

export const config: PluginConfigDescriptor<ContextProviderConfigType> = {
  schema: configSchema,
  exposeToBrowser: {
    enabled: true,
  },
};

/**
 * @experimental This plugin is experimental and will change in future releases.
 */
export function plugin(initializerContext: PluginInitializerContext) {
  return new ContextProviderServerPlugin(initializerContext);
}

export { ContextProviderServerPluginSetup, ContextProviderServerPluginStart } from './types';
