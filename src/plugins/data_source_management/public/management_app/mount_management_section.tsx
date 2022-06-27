import { StartServicesAccessor } from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import { I18nProvider } from '@osd/i18n/react';
import { DataSourceManagementApp } from '../components/app';
import { ManagementAppMountParams } from '../../../management/public';

import { DataSourceManagmentContext, MlCardState } from '../types';
import { DataSourceManagementStart } from '../plugin';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { DataSourceTableWithRouter } from '../components/data_source_table';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams
  // getMlCardState: () => MlCardState
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
    { data },
    dataSourceManagementStart,
  ] = await getStartServices();
  // const canSave = Boolean(application.capabilities.indexPatterns.save); todo

  const deps: DataSourceManagmentContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    dataSourceManagementStart: dataSourceManagementStart as DataSourceManagementStart,
    setBreadcrumbs: params.setBreadcrumbs,
    // getMlCardState,
  };

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        <Router history={params.history}>
          <Switch>
            {/* <Route path={['/create']}>
              <CreateIndexPatternWizardWithRouter />
            </Route>
            <Route path={['/patterns/:id/field/:fieldName', '/patterns/:id/create-field/']}>
              <CreateEditFieldContainer />
            </Route>
            <Route path={['/patterns/:id']}>
              <EditIndexPatternContainer />
            </Route> */}
            <Route path={['/']}>
              <DataSourceTableWithRouter canSave={true} />
            </Route>
          </Switch>
        </Router>
      </I18nProvider>
    </OpenSearchDashboardsContextProvider>,
    params.element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
