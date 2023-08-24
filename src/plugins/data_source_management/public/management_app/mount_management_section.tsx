/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  ChromeBreadcrumb,
  ScopedHistory,
  StartServicesAccessor,
} from 'src/core/public';

import { I18nProvider } from '@osd/i18n/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { CreateDataSourceWizardWithRouter } from '../components/create_data_source_wizard';
import { DataSourceTableWithRouter } from '../components/data_source_table';
import { DataSourceManagementContext, DataSourceManagementStartDependencies } from '../types';
import { EditDataSourceWithRouter } from '../components/edit_data_source';
import { PageWrapper } from '../components/page_wrapper';
import { reactRouterNavigate } from '../../../opensearch_dashboards_react/public';

export async function mountDataSourcesManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: AppMountParameters
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
  ] = await getStartServices();

  const setBreadcrumbsScoped = (crumbs: ChromeBreadcrumb[] = []) => {
    const wrapBreadcrumb = (item: ChromeBreadcrumb, scopedHistory: ScopedHistory) => ({
      ...item,
      ...(item.href ? reactRouterNavigate(scopedHistory, item.href) : {}),
    });

    chrome.setBreadcrumbs([...crumbs.map((item) => wrapBreadcrumb(item, params.history))]);
  };

  const deps: DataSourceManagementContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    setBreadcrumbs: setBreadcrumbsScoped,
  };

  ReactDOM.render(
    <PageWrapper>
      <OpenSearchDashboardsContextProvider services={deps}>
        <I18nProvider>
          <Router history={params.history}>
            <Switch>
              <Route path={['/create']}>
                <CreateDataSourceWizardWithRouter />
              </Route>
              <Route path={['/:id']}>
                <EditDataSourceWithRouter />
              </Route>
              <Route path={['/']}>
                <DataSourceTableWithRouter />
              </Route>
            </Switch>
          </Router>
        </I18nProvider>
      </OpenSearchDashboardsContextProvider>
    </PageWrapper>,
    params.element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
