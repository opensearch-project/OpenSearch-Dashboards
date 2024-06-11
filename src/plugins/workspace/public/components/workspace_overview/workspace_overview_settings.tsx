/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkspaceUpdater } from '../workspace_updater';
import { WorkspaceOverviewProps } from './workspace_overview';

export const WorkspaceOverviewSettings = ({
  workspaceConfigurableApps$,
}: WorkspaceOverviewProps) => {
  return (
    <WorkspaceUpdater
      hideTitle={true}
      maxWidth="100%"
      workspaceConfigurableApps$={workspaceConfigurableApps$}
    />
  );
};
