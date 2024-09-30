/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { EuiLoadingSpinner, EuiPageContent } from '@elastic/eui';
import { CoreSetup } from 'src/core/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { ManagementAppMountParams } from '../../../management/public';
import { StartDependencies, SavedObjectsManagementPluginStart } from '../plugin';
import { ISavedObjectsManagementServiceRegistry } from '../services';
import { getAllowedTypes } from './../lib';

interface MountParams {
  core: CoreSetup<StartDependencies, SavedObjectsManagementPluginStart>;
  serviceRegistry: ISavedObjectsManagementServiceRegistry;
  mountParams: ManagementAppMountParams & { wrapInPage?: boolean };
  dataSourceEnabled: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

let allowedObjectTypes: string[] | undefined;

const savedObjectsTitle = i18n.translate('savedObjectsManagement.objects.savedObjectsTitle', {
  defaultMessage: 'Saved Objects',
});
const workspaceAssetsTitle = i18n.translate('savedObjectsManagement.objects.workspaceAssetsTitle', {
  defaultMessage: 'Workspace assets',
});
const assetsTitle = i18n.translate('savedObjectsManagement.objects.assetsTitle', {
  defaultMessage: 'Assets',
});

const SavedObjectsEditionPage = lazy(() => import('./saved_objects_edition_page'));
const SavedObjectsTablePage = lazy(() => import('./saved_objects_table_page'));
export const mountManagementSection = async ({
  core,
  mountParams,
  serviceRegistry,
  dataSourceEnabled,
  dataSourceManagement,
}: MountParams) => {
  const [coreStart, { data, uiActions, navigation }, pluginStart] = await core.getStartServices();
  const { element, history, setBreadcrumbs } = mountParams;
  if (allowedObjectTypes === undefined) {
    allowedObjectTypes = await getAllowedTypes(coreStart.http);
  }
  // Restrict user to manage data source in the saved object management page according the manageableBy flag.
  const showDataSource = !!coreStart.application.capabilities?.dataSource?.canManage;
  allowedObjectTypes = showDataSource
    ? allowedObjectTypes
    : allowedObjectTypes.filter((type) => type !== 'data-source');

  const useUpdatedUX = coreStart.uiSettings.get('home:useNewHomePage');
  const currentWorkspaceId = coreStart.workspaces.currentWorkspaceId$.getValue();
  const getDocTitle = () => {
    if (currentWorkspaceId) {
      return workspaceAssetsTitle;
    }
    if (useUpdatedUX) {
      return assetsTitle;
    }
    return savedObjectsTitle;
  };

  coreStart.chrome.docTitle.change(getDocTitle());

  const capabilities = coreStart.application.capabilities;

  const RedirectToHomeIfUnauthorized: React.FunctionComponent = ({ children }) => {
    const allowed = capabilities?.management?.opensearchDashboards?.objects ?? false;

    if (!allowed) {
      coreStart.application.navigateToApp('home');
      return null;
    }
    return children! as React.ReactElement;
  };

  const content = (
    <Router history={history}>
      <Switch>
        <Route path={'/:service/:id'} exact={true}>
          <RedirectToHomeIfUnauthorized>
            <Suspense fallback={<EuiLoadingSpinner />}>
              <SavedObjectsEditionPage
                coreStart={coreStart}
                uiActionsStart={uiActions}
                serviceRegistry={serviceRegistry}
                setBreadcrumbs={setBreadcrumbs}
                history={history}
                useUpdatedUX={useUpdatedUX}
                navigation={navigation}
              />
            </Suspense>
          </RedirectToHomeIfUnauthorized>
        </Route>
        <Route path={'/'} exact={false}>
          <RedirectToHomeIfUnauthorized>
            <Suspense fallback={<EuiLoadingSpinner />}>
              <SavedObjectsTablePage
                coreStart={coreStart}
                dataStart={data}
                serviceRegistry={serviceRegistry}
                actionRegistry={pluginStart.actions}
                columnRegistry={pluginStart.columns}
                namespaceRegistry={pluginStart.namespaces}
                allowedTypes={allowedObjectTypes}
                setBreadcrumbs={setBreadcrumbs}
                dataSourceEnabled={dataSourceEnabled}
                dataSourceManagement={dataSourceManagement}
                navigation={navigation}
                useUpdatedUX={useUpdatedUX}
              />
            </Suspense>
          </RedirectToHomeIfUnauthorized>
        </Route>
      </Switch>
    </Router>
  );

  const pageContentPaddingSize = useUpdatedUX
    ? // align with new header
      {
        paddingSize: 'm' as const,
      }
    : {};

  ReactDOM.render(
    <I18nProvider>
      {mountParams.wrapInPage ? (
        <EuiPageContent
          hasShadow={false}
          hasBorder={false}
          color="transparent"
          {...pageContentPaddingSize}
        >
          {content}
        </EuiPageContent>
      ) : (
        content
      )}
    </I18nProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
