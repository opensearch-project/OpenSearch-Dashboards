/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
import { WorkspacePlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new WorkspacePlugin(initializerContext);
}
