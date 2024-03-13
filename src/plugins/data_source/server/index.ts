/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from 'src/core/server';
import { DataSourcePlugin } from './plugin';
import { configSchema, DataSourcePluginConfigType } from '../config';

export const config: PluginConfigDescriptor<DataSourcePluginConfigType> = {
  exposeToBrowser: {
    enabled: true,
    hideLocalCluster: true,
    authTypes: true,
  },
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataSourcePlugin(initializerContext);
}

export {
  DataSourcePluginSetup,
  DataSourcePluginStart,
  DataSourcePluginRequestContext,
} from './types';
