/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';

export { ContentManagementPluginSetup, ContentManagementPluginStart } from './types';
import { ContentManagementPublicPlugin } from './plugin';

export const plugin = (initializerContext: PluginInitializerContext) =>
  new ContentManagementPublicPlugin(initializerContext);

export * from './components';
export * from './mocks';
