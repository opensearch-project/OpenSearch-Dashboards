/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { configSchema, SavedObjectTagsConfig } from './config';
import { SavedObjectTagsPlugin } from './plugin';

export const config: PluginConfigDescriptor<SavedObjectTagsConfig> = {
  schema: configSchema,
};

export const plugin = (_initializerContext: PluginInitializerContext<SavedObjectTagsConfig>) =>
  new SavedObjectTagsPlugin();
