import { WorkspaceCreator } from './workspace_creator';

export const paths = {
  create: '/create',
};

interface RouteConfig {
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
