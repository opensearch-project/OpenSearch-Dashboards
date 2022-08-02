/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { schema, TypeOf } from 'packages/osd-config-schema/target/types';
import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
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
