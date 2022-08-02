/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { PluginConfigDescriptor, PluginInitializerContext } from 'src/core/server';
import { DataSourcePlugin } from './plugin';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
});

export type DataSourcePluginConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<DataSourcePluginConfigType> = {
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataSourcePlugin(initializerContext);
}

export { DataSourcePluginSetup, DataSourcePluginStart } from './types';
