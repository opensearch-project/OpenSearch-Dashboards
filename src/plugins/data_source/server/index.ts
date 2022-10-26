/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from 'src/core/server';
import { DataSourcePlugin } from './plugin';
import { configSchema, DataSourcePluginConfigType } from '../config';

export const config: PluginConfigDescriptor<DataSourcePluginConfigType> = {
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataSourcePlugin(initializerContext);
}

export { DataSourcePluginSetup, DataSourcePluginStart } from './types';
