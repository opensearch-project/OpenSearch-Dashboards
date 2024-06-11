import { PluginConfigDescriptor, PluginInitializerContext } from '../../../src/core/server';
import { QueryEnhancementsPlugin } from './plugin';
import { configSchema, ConfigSchema } from '../common/config';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {},
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new QueryEnhancementsPlugin(initializerContext);
}

export { QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart } from './types';
