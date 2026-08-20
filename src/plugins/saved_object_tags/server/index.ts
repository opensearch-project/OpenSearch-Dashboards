/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/server';
import { SavedObjectTagsPlugin } from './plugin';

export const plugin = (_initializerContext: PluginInitializerContext) =>
  new SavedObjectTagsPlugin();
