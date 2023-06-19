/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PATHS } from '../../common/constants';

import { WorkspaceCreator } from './workspace_creator';
import { WorkspaceOverview } from './workspace_overview';

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
];
