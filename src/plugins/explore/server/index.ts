/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigSchema, configSchema } from '../common/config';
import { ExplorePlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new ExplorePlugin(initializerContext);
}

export { ExplorePluginSetup, ExplorePluginStart } from './types';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    enabled: true,
  },
  schema: configSchema,
};
