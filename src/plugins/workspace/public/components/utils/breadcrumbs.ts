/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { matchPath } from 'react-router-dom';

import { RouteConfig } from '../routes';
import { ChromeBreadcrumb } from '../../../../../core/public';
import { WORKSPACE_APP_NAME } from '../../../common/constants';
import { join } from './path';

export const createBreadcrumbsFromPath = (
  pathname: string,
  routeConfig: RouteConfig[],
  appBasePath: string
): ChromeBreadcrumb[] => {
  const breadcrumbs: ChromeBreadcrumb[] = [];
  while (pathname !== '/') {
    const matchedRoute = routeConfig.find((route) =>
      matchPath(pathname, { path: route.path, exact: true })
    );
    if (matchedRoute) {
      if (breadcrumbs.length === 0) {
        breadcrumbs.unshift({ text: matchedRoute.label });
      } else {
        breadcrumbs.unshift({
          text: matchedRoute.label,
          href: join(appBasePath, matchedRoute.path),
        });
      }
    }
    const pathArr = pathname.split('/');
    pathArr.pop();
    pathname = pathArr.join('/') ? pathArr.join('/') : '/';
  }
  breadcrumbs.unshift({ text: WORKSPACE_APP_NAME, href: appBasePath });
  return breadcrumbs;
};
