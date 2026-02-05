/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router, Switch, Route } from 'react-router-dom';

import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import { StartServicesAccessor } from 'src/core/public';

import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { EuiPageContent } from '@elastic/eui';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ManagementAppMountParams } from '../../../management/public';
import {
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  DatasetTableWithRouter,
  EditDatasetContainer,
  CreateEditFieldContainer,
  CreateDatasetWizardWithRouter,
} from '../components';
import { DatasetManagementStartDependencies, DatasetManagementStart } from '../plugin';
import { DatasetManagmentContext, MlCardState } from '../types';
import { createStorage } from '../../../data/common';
import { DatasetTableV2WithRouter } from '../components/dataset_table/dataset_table_v2';

const readOnlyBadge = {
  text: i18n.translate('datasetManagement.indexPatterns.badge.readOnly.text', {
    defaultMessage: 'Read only',
  }),
  tooltip: i18n.translate('datasetManagement.indexPatterns.badge.readOnly.tooltip', {
    defaultMessage: 'Unable to save index patterns',
  }),
  iconType: 'glasses',
};

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DatasetManagementStartDependencies>,
  params: ManagementAppMountParams & { wrapInPage?: boolean },
  getMlCardState: () => MlCardState,
  dataSource?: DataSourcePluginSetup
) {
  const [
    {
      chrome,
      application,
      savedObjects,
      uiSettings,
      notifications,
      overlays,
      http,
      docLinks,
      workspaces,
    },
    { data, navigation },
    datasetManagementStart,
  ] = await getStartServices();
  const canSave = Boolean(application.capabilities?.indexPatterns?.save);
  const dataSourceEnabled = dataSource?.dataSourceEnabled ?? false;
  const hideLocalCluster = dataSource?.hideLocalCluster ?? false;

  if (!canSave) {
    chrome.setBadge(readOnlyBadge);
  }

  const deps: DatasetManagmentContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    navigationUI: navigation.ui,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    datasetManagementStart: datasetManagementStart as DatasetManagementStart,
    setBreadcrumbs: params.setBreadcrumbs,
    getMlCardState,
    dataSourceEnabled,
    hideLocalCluster,
    workspaces,
    appName: 'dataset_management',
    storage: createStorage({ engine: window.localStorage, prefix: 'opensearchDashboards.' }),
  };

  const showActionsInHeader = uiSettings.get('home:useNewHomePage');

  const content = (
    <Router history={params.history}>
      <Switch>
        <Route path={['/create']}>
          <CreateDatasetWizardWithRouter />
        </Route>
        <Route path={['/patterns/:id/field/:fieldName', '/patterns/:id/create-field/']}>
          <CreateEditFieldContainer />
        </Route>
        <Route path={['/patterns/:id']}>
          <EditDatasetContainer />
        </Route>
        <Route path={['/']}>
          <DatasetTableV2WithRouter canSave={canSave} />
        </Route>
      </Switch>
    </Router>
  );

  const root = createRoot(params.element);
  root.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        {params.wrapInPage ? (
          <EuiPageContent
            hasShadow={false}
            hasBorder={false}
            color="transparent"
            paddingSize={showActionsInHeader ? 'm' : 'l'}
          >
            {content}
          </EuiPageContent>
        ) : (
          content
        )}
      </I18nProvider>
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    chrome.docTitle.reset();
    root.unmount();
  };
}
