/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { PluginInitializerContext } from '../../../core/server';
import { PointInTimeManagementPlugin } from './plugin';

export const config = {
  schema: schema.object({ enabled: schema.boolean({ defaultValue: false }) }),
};

// This exports static code and TypeScript types,
// as well as the OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new PointInTimeManagementPlugin(initializerContext);
}

export { PointInTimeManagementPluginSetup, PointInTimeManagementPluginStart } from './types';
