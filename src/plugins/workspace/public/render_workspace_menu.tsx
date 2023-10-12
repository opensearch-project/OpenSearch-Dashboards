/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ApplicationStart, HttpSetup, WorkspacesStart } from '../../../core/public';
import { WorkspaceMenu } from './components/workspace_menu/workspace_menu';

export function renderWorkspaceMenu({
  basePath,
  getUrlForApp,
  workspaces,
  navigateToUrl,
}: {
  getUrlForApp: ApplicationStart['getUrlForApp'];
  basePath: HttpSetup['basePath'];
  workspaces: WorkspacesStart;
  navigateToUrl: ApplicationStart['navigateToUrl'];
}) {
  return (
    <WorkspaceMenu
      basePath={basePath}
      getUrlForApp={getUrlForApp}
      workspaces={workspaces}
      navigateToUrl={navigateToUrl}
    />
  );
}
