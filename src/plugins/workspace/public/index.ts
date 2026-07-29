/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';
import { WorkspacePublicConfig } from '../config';
import { WorkspacePlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext<WorkspacePublicConfig>) {
  return new WorkspacePlugin(initializerContext);
}

export { WorkspacePluginSetup, WorkspaceCollaborator } from './types';
export { WorkspaceCollaboratorType } from './services';
