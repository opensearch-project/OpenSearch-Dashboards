/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceCreator } from './workspace_creator';

export const paths = {
  create: '/create',
};

export interface RouteConfig {
  path: string;
  Component: React.ComponentType<any>;
  label: string;
  exact?: boolean;
}

export const ROUTES: RouteConfig[] = [
  {
    path: paths.create,
    Component: WorkspaceCreator,
    label: 'Create',
  },
];
