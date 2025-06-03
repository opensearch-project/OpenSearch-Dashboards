/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspacePlugin } from './plugin';

export function plugin() {
  return new WorkspacePlugin();
}

export { WorkspacePluginSetup, WorkspaceCollaborator } from './types';
export { WorkspaceCollaboratorType } from './services';
