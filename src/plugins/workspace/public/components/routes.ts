/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PATHS } from '../../common/constants';

import { WorkspaceCreator } from './workspace_creator';
import { WorkspaceUpdater } from './workspace_updater';
import { WorkspaceOverview } from './workspace_overview';
import { WorkspaceList } from './workspace_list';

export interface RouteConfig {
  path: string;
  Component: React.ComponentType<any>;
  label: string;
  exact?: boolean;
}

export const ROUTES: RouteConfig[] = [
  {
    path: PATHS.create,
    Component: WorkspaceCreator,
    label: 'Create',
  },
  {
    path: PATHS.overview,
    Component: WorkspaceOverview,
    label: 'Overview',
  },
  {
    path: PATHS.update,
    Component: WorkspaceUpdater,
    label: 'Update',
  },
  {
    path: PATHS.list,
    Component: WorkspaceList,
    label: 'List',
  },
];
