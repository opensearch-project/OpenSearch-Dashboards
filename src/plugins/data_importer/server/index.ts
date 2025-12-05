/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { configSchema, ConfigSchema } from '../config';
import { DataImporterPlugin } from './plugin';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  schema: configSchema,
  exposeToBrowser: {
    enabledFileTypes: true,
    maxFileSizeBytes: true,
    maxTextCount: true,
  },
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataImporterPlugin(initializerContext);
}

export * from './types';
