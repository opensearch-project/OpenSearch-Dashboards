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

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';

import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import { AppMountParameters, CoreStart, StartServicesAccessor } from 'src/core/public';

import { EuiPageContent } from '@elastic/eui';
import { ContentManagementPluginStart } from '../../../content_management/public';
import { AdvancedSettings } from './advanced_settings';
import { ManagementAppMountParams } from '../../../management/public';
import { ComponentRegistry } from '../types';
import { NavigationPublicPluginStart } from '../../../navigation/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

import './index.scss';
import { UserSettingsApp } from './user_settings';

const readOnlyBadge = {
  text: i18n.translate('advancedSettings.badge.readOnly.text', {
    defaultMessage: 'Read only',
  }),
  tooltip: i18n.translate('advancedSettings.badge.readOnly.tooltip', {
    defaultMessage: 'Unable to save advanced settings',
  }),
  iconType: 'glasses',
};

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<{
    navigation: NavigationPublicPluginStart;
  }>,
  params: ManagementAppMountParams & { wrapInPage?: boolean },
  componentRegistry: ComponentRegistry['start']
) {
  const [
    { uiSettings, notifications, docLinks, application, chrome },
    { navigation },
  ] = await getStartServices();

  const canSave = application.capabilities.advancedSettings.save as boolean;

  if (!canSave) {
    chrome.setBadge(readOnlyBadge);
  }

  const title = i18n.translate('advancedSettings.advancedSettingsLabel', {
    defaultMessage: 'Advanced settings',
  });
  const newUXTitle = i18n.translate('advancedSettings.newHeader.pageTitle', {
    defaultMessage: 'Application settings',
  });

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');
  // If new navigation is off, this will be rendered as breadcrumb. If is on, this will be rendered as title.
  const crumb = [{ text: useUpdatedUX ? newUXTitle : title }];
  params.setBreadcrumbs(crumb);

  const content = (
    <Router history={params.history}>
      <Switch>
        <Route path={['/:query', '/']}>
          <AdvancedSettings
            enableSaving={canSave}
            toasts={notifications.toasts}
            dockLinks={docLinks.links}
            uiSettings={uiSettings}
            componentRegistry={componentRegistry}
            useUpdatedUX={useUpdatedUX}
            navigationUI={navigation.ui}
            application={application}
          />
        </Route>
      </Switch>
    </Router>
  );

  const pagePaddingSize = useUpdatedUX
    ? // When useUpdatedUX is enabled, page should align with header vertically.
      {
        paddingSize: 'm' as const,
      }
    : {};

  ReactDOM.render(
    <I18nProvider>
      {params.wrapInPage ? (
        <EuiPageContent
          hasShadow={false}
          hasBorder={false}
          color="transparent"
          {...pagePaddingSize}
        >
          {content}
        </EuiPageContent>
      ) : (
        content
      )}
    </I18nProvider>,
    params.element
  );
  return () => {
    ReactDOM.unmountComponentAtNode(params.element);
  };
}

export const renderUserSettingsApp = async (
  { element }: AppMountParameters,
  services: CoreStart & {
    contentManagement: ContentManagementPluginStart;
    navigation: NavigationPublicPluginStart;
  }
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <UserSettingsApp />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
