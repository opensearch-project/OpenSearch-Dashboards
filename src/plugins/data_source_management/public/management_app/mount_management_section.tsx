import { StartServicesAccessor } from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import { I18nProvider } from '@osd/i18n/react';
import { DataSourceStart } from 'src/plugins/data_sources/public/plugin';
import { DataSourceManagementApp } from '../components/app';
import { ManagementAppMountParams } from '../../../management/public';

import { DataSourceManagmentContext, MlCardState } from '../types';
import { DataSourceManagementStart } from '../plugin';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { DataSourceTableWithRouter } from '../components/data_source_table';
import { CreateDataSourceWizardWithRouter } from '../components/create_data_source_wizard';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
  dataSource: DataSourceStart;
}

// todo: move the data source management part on top of navigation bar
export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams
  // getMlCardState: () => MlCardState
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
    { data, dataSource },
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
    dataSource,
    dataSourceManagementStart: dataSourceManagementStart as DataSourceManagementStart,
    setBreadcrumbs: params.setBreadcrumbs,
    // getMlCardState,
  };

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        <Router history={params.history}>
          <Switch>
            <Route path={['/create']}>
              <CreateDataSourceWizardWithRouter />
            </Route>
            {/* 
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
