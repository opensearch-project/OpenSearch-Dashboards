/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from 'opensearch-dashboards/server';
import { configSchema, ConfigSchema } from '../common/config';
import { DatasetManagementPlugin } from './plugin';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    enabled: true,
    aliasedAsIndexPattern: true,
  },
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new DatasetManagementPlugin(initializerContext);
}
