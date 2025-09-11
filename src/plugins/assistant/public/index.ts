/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { PluginInitializerContext } from '../../../core/public';
import { AssistantConfig } from '../common/config';
import { AssistantPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin(initializerContext: PluginInitializerContext<AssistantConfig>) {
  return new AssistantPlugin(initializerContext);
}
export { AssistantPluginSetup, AssistantPluginStart } from './types';
