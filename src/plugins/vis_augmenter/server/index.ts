/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { VisAugmenterPlugin } from './plugin';
import { configSchema, VisAugmenterPluginConfigType } from '../config';

export const config: PluginConfigDescriptor<VisAugmenterPluginConfigType> = {
  exposeToBrowser: {
    pluginAugmentationEnabled: true,
  },
  schema: configSchema,
};
export function plugin(initializerContext: PluginInitializerContext) {
  return new VisAugmenterPlugin(initializerContext);
}
export { VisAugmenterPluginSetup, VisAugmenterPluginStart } from './plugin';
