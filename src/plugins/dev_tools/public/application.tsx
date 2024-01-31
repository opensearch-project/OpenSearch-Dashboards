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

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { EuiTab, EuiTabs, EuiToolTip, EuiComboBoxOptionOption } from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';

import {
  ApplicationStart,
  ChromeStart,
  CoreStart,
  NotificationsStart,
  SavedObjectsStart,
  ScopedHistory,
} from 'src/core/public';

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { DataSourcePicker } from '../../data_source_management/public/components/data_source_picker/data_source_picker';
import { DevToolApp } from './dev_tool';
import { DevToolsSetupDependencies } from './plugin';
import { addHelpMenuToAppChrome } from './utils/util';

interface DevToolsWrapperProps {
  devTools: readonly DevToolApp[];
  activeDevTool: DevToolApp;
  updateRoute: (newRoute: string) => void;
  savedObjects: SavedObjectsStart;
  notifications: NotificationsStart;
  dataSourceEnabled: boolean;
}

interface MountedDevToolDescriptor {
  devTool: DevToolApp;
  mountpoint: HTMLElement;
  unmountHandler: () => void;
}

function DevToolsWrapper({
  devTools,
  activeDevTool,
  updateRoute,
  savedObjects,
  notifications: { toasts },
  dataSourceEnabled,
}: DevToolsWrapperProps) {
  const mountedTool = useRef<MountedDevToolDescriptor | null>(null);

  useEffect(
    () => () => {
      if (mountedTool.current) {
        mountedTool.current.unmountHandler();
      }
    },
    []
  );

  const onChange = async (e: Array<EuiComboBoxOptionOption<any>>) => {
    const dataSourceId = e[0] ? e[0].id : undefined;
    await remount(mountedTool.current!.mountpoint, dataSourceId);
  };

  const remount = async (mountPoint: HTMLElement, dataSourceId?: string) => {
    if (mountedTool.current) {
      mountedTool.current.unmountHandler();
    }

    const params = {
      element: mountPoint,
      appBasePath: '',
      onAppLeave: () => undefined,
      setHeaderActionMenu: () => undefined,
      // TODO: adapt to use Core's ScopedHistory
      history: {} as any,
      dataSourceId,
    };
    const unmountHandler = await activeDevTool.mount(params);

    mountedTool.current = {
      devTool: activeDevTool,
      mountpoint: mountPoint,
      unmountHandler,
    };
  };

  return (
    <main className="devApp">
      <EuiTabs className="devAppTabs">
        {devTools.map((currentDevTool) => (
          <EuiToolTip content={currentDevTool.tooltipContent} key={currentDevTool.id}>
            <EuiTab
              disabled={currentDevTool.isDisabled()}
              isSelected={currentDevTool === activeDevTool}
              onClick={() => {
                if (!currentDevTool.isDisabled()) {
                  updateRoute(`/${currentDevTool.id}`);
                }
              }}
            >
              {currentDevTool.title}
            </EuiTab>
          </EuiToolTip>
        ))}
        {dataSourceEnabled ? (
          <div className="devAppDataSourcePicker">
            <DataSourcePicker
              savedObjectsClient={savedObjects.client}
              notifications={toasts}
              onSelectedDataSource={onChange}
              disabled={!dataSourceEnabled}
            />
          </div>
        ) : null}
      </EuiTabs>

      <div
        className="devApp__container"
        role="tabpanel"
        data-test-subj={activeDevTool.id}
        ref={async (element) => {
          if (
            element &&
            (mountedTool.current === null ||
              mountedTool.current.devTool !== activeDevTool ||
              mountedTool.current.mountpoint !== element)
          ) {
            await remount(element);
          }
        }}
      />
    </main>
  );
}

function redirectOnMissingCapabilities(application: ApplicationStart) {
  if (!application.capabilities.dev_tools.show) {
    application.navigateToApp('home');
    return true;
  }
  return false;
}

function setBadge(application: ApplicationStart, chrome: ChromeStart) {
  if (application.capabilities.dev_tools.save) {
    return;
  }

  chrome.setBadge({
    text: i18n.translate('devTools.badge.readOnly.text', {
      defaultMessage: 'Read only',
    }),
    tooltip: i18n.translate('devTools.badge.readOnly.tooltip', {
      defaultMessage: 'Unable to save',
    }),
    iconType: 'glasses',
  });
}

function setTitle(chrome: ChromeStart) {
  chrome.docTitle.change(
    i18n.translate('devTools.pageTitle', {
      defaultMessage: 'Dev Tools',
    })
  );
}

function setBreadcrumbs(chrome: ChromeStart) {
  chrome.setBreadcrumbs([
    {
      text: i18n.translate('devTools.k7BreadcrumbsDevToolsLabel', {
        defaultMessage: 'Dev Tools',
      }),
      href: '#/',
    },
  ]);
}

export function renderApp(
  { application, chrome, docLinks, savedObjects, notifications }: CoreStart,
  element: HTMLElement,
  history: ScopedHistory,
  devTools: readonly DevToolApp[],
  { dataSource }: DevToolsSetupDependencies
) {
  const dataSourceEnabled = !!dataSource;
  if (redirectOnMissingCapabilities(application)) {
    return () => {};
  }

  addHelpMenuToAppChrome(chrome, docLinks);
  setBadge(application, chrome);
  setBreadcrumbs(chrome);
  setTitle(chrome);

  ReactDOM.render(
    <I18nProvider>
      <Router>
        <Switch>
          {devTools
            // Only create routes for devtools that are not disabled
            .filter((devTool) => !devTool.isDisabled())
            .map((devTool) => (
              <Route
                key={devTool.id}
                path={`/${devTool.id}`}
                exact={!devTool.enableRouting}
                render={(props) => (
                  <DevToolsWrapper
                    updateRoute={props.history.push}
                    activeDevTool={devTool}
                    devTools={devTools}
                    savedObjects={savedObjects}
                    notifications={notifications}
                    dataSourceEnabled={dataSourceEnabled}
                  />
                )}
              />
            ))}
          <Route path="/">
            <Redirect to={`/${devTools[0].id}`} />
          </Route>
        </Switch>
      </Router>
    </I18nProvider>,
    element
  );

  // dispatch synthetic hash change event to update hash history objects
  // this is necessary because hash updates triggered by using popState won't trigger this event naturally.
  const unlisten = history.listen(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(element);
    unlisten();
  };
}
