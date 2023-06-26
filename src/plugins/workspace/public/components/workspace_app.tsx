/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { ROUTES } from './routes';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { createBreadcrumbsFromPath } from './utils/breadcrumbs';

export const WorkspaceApp = ({ appBasePath }: { appBasePath: string }) => {
  const {
    services: { chrome },
  } = useOpenSearchDashboards();
  const location = useLocation();

  /**
   * map the current pathname to breadcrumbs
   */
  useEffect(() => {
    const breadcrumbs = createBreadcrumbsFromPath(location.pathname, ROUTES, appBasePath);
    chrome?.setBreadcrumbs(breadcrumbs);
  }, [appBasePath, location.pathname, chrome]);

  return (
    <I18nProvider>
      <Switch>
        {ROUTES.map(({ path, Component, exact }) => (
          <Route key={path} path={path} render={() => <Component />} exact={exact ?? false} />
        ))}
      </Switch>
    </I18nProvider>
  );
};
