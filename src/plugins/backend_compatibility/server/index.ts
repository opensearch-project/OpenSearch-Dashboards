/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext, PluginConfigDescriptor } from 'src/core/server';
import { BackendCompatibilityPlugin } from './plugin';
import { configSchema, BackendCompatibilityConfig } from './config';

export const config: PluginConfigDescriptor<BackendCompatibilityConfig> = {
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new BackendCompatibilityPlugin(initializerContext);
}

export type { BackendCompatibilityConfig } from './config';
export type { BackendCompatibilityPluginSetup, BackendCompatibilityPluginStart } from './plugin';
export type { BackendInfo, BackendDistribution } from './transport/types';
