import React, { useEffect } from 'react';
import { EuiPage, EuiPageBody } from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';
import { matchPath, Route, Switch, useLocation } from 'react-router-dom';

import { ROUTES } from './routes';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { ChromeBreadcrumb } from '../../../../core/public';
import { WORKSPACE_APP_NAME } from '../../common/constants';

export const WorkspaceApp = ({ appBasePath }: { appBasePath: string }) => {
  const {
    services: { chrome },
  } = useOpenSearchDashboards();
  const location = useLocation();

  /**
   * map the current pathname to breadcrumbs
   */
  useEffect(() => {
    let pathname = location.pathname;
    const breadcrumbs: ChromeBreadcrumb[] = [];

    while (pathname !== '/') {
      const matchedRoute = ROUTES.find((route) =>
        matchPath(pathname, { path: route.path, exact: true })
      );
      if (matchedRoute) {
        if (breadcrumbs.length === 0) {
          breadcrumbs.unshift({ text: matchedRoute.label });
        } else {
          breadcrumbs.unshift({
            text: matchedRoute.label,
            href: `${appBasePath}${matchedRoute.path}`,
          });
        }
      }
      const pathArr = pathname.split('/');
      pathArr.pop();
      pathname = pathArr.join('/') ? pathArr.join('/') : '/';
    }
    breadcrumbs.unshift({ text: WORKSPACE_APP_NAME, href: appBasePath });
    chrome?.setBreadcrumbs(breadcrumbs);
  }, [appBasePath, location.pathname, chrome?.setBreadcrumbs]);

  return (
    <I18nProvider>
      <EuiPage>
        <EuiPageBody component="main">
          <Switch>
            {ROUTES.map(({ path, Component, exact }) => (
              <Route key={path} path={path} render={() => <Component />} exact={exact ?? false} />
            ))}
          </Switch>
        </EuiPageBody>
      </EuiPage>
    </I18nProvider>
  );
};
