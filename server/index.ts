/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../src/core/server';
import { QueryEnhancementsPlugin } from './plugin';
import { configSchema, ConfigSchema } from '../common/config';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    queryAssist: true,
  },
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new QueryEnhancementsPlugin(initializerContext);
}

export {
  Facet,
  JobsFacet,
  OpenSearchPPLPlugin,
  OpenSearchObservabilityPlugin,
  shimStats,
  shimSchemaRow,
} from './utils';
export { QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart } from './types';
