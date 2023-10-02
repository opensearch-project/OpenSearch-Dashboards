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

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';

import {
  EuiPage,
  EuiTitle,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiTabbedContent,
} from '@elastic/eui';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { UiActionsExplorerServices, UiActionsExplorerStartDependencies } from './types';
import { OpenSearchDashboardsContextProvider } from '../../../src/plugins/opensearch_dashboards_react/public';

import { BasicTab } from './basic_tab';
import { ExplorerTab } from './explorer_tab';

const ActionsExplorer = () => {
  const tabs = useMemo(
    () => [
      {
        id: 'demo-basic',
        name: (
          <FormattedMessage
            id="uiActionsExplorer.demoBasic.TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Basic' }}
          />
        ),
        content: <BasicTab />,
      },
      {
        id: 'demo-explorer',
        name: (
          <FormattedMessage
            id="uiActionsExplorer.demoExplorer.TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Explorer' }}
          />
        ),
        content: <ExplorerTab />,
      },
    ],
    []
  );

  return (
    <I18nProvider>
      <EuiPage restrictWidth="1500px">
        <EuiPageBody component="main">
          <EuiPageHeader>
            <EuiTitle size="l">
              <h1>
                <FormattedMessage
                  id="uiAsctionsExample.appTitle"
                  defaultMessage="{name}"
                  values={{ name: 'UI Actions' }}
                />
              </h1>
            </EuiTitle>
          </EuiPageHeader>
          <EuiPageContent>
            <EuiPageContentBody>
              <EuiTabbedContent tabs={tabs} initialSelectedTab={tabs[0]} />
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    </I18nProvider>
  );
};

export const renderApp = (
  coreStart: CoreStart,
  { uiActions }: UiActionsExplorerStartDependencies,
  { element }: AppMountParameters
) => {
  const services: UiActionsExplorerServices = {
    ...coreStart,
    uiActions,
  };
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <ActionsExplorer />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
