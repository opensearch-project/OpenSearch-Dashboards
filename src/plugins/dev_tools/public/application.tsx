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
  MountPoint,
  NotificationsStart,
  SavedObjectsStart,
  ScopedHistory,
} from 'src/core/public';

import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
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
  dataSourceManagement?: DataSourceManagementPluginSetup;
  useUpdatedUX?: boolean;
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
  onManageDataSource: () => void;
}

interface MountedDevToolDescriptor {
  devTool: DevToolApp;
  mountpoint: HTMLElement;
  unmountHandler: () => void;
}

function DevToolsWrapper({
  onManageDataSource,
  devTools,
  activeDevTool,
  updateRoute,
  savedObjects,
  notifications,
  dataSourceEnabled,
  dataSourceManagement,
  useUpdatedUX,
  setMenuMountPoint,
}: DevToolsWrapperProps) {
  const { toasts } = notifications;
  const mountedTool = useRef<MountedDevToolDescriptor | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const unmountHandler = await activeDevTool.mount(params);

    mountedTool.current = {
      devTool: activeDevTool,
      mountpoint: mountPoint,
      unmountHandler,
    };
    setIsLoading(false);
  };

  const renderDataSourceSelector = () => {
    if (useUpdatedUX) {
      const DataSourceMenu = dataSourceManagement!.ui.getDataSourceMenu();
      return (
        <DataSourceMenu
          onManageDataSource={onManageDataSource}
          setMenuMountPoint={setMenuMountPoint}
          componentType={'DataSourceSelectable'}
          componentConfig={{
            savedObjects: savedObjects.client,
            notifications,
            fullWidth: false,
            onSelectedDataSources: onChange,
          }}
        />
      );
    }
    const DataSourceSelector = dataSourceManagement!.ui.DataSourceSelector;
    return (
      <div className="devAppDataSourceSelector">
        {/* @ts-expect-error TS2604 TODO(ts-error): fixme */}
        <DataSourceSelector
          savedObjectsClient={savedObjects.client}
          notifications={toasts}
          onSelectedDataSource={onChange}
          disabled={!dataSourceEnabled}
          fullWidth={false}
          compressed={true}
        />
      </div>
    );
  };

  return (
    <main className="devApp">
      <EuiTabs size="s" className="devAppTabs">
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
        {dataSourceEnabled && !isLoading && dataSourceManagement && renderDataSourceSelector()}
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
            let initialDataSourceId;
            if (!dataSourceEnabled) {
              initialDataSourceId = '';
            }

            await remount(element, initialDataSourceId);
          }
        }}
      />
    </main>
  );
}

function redirectOnMissingCapabilities(application: ApplicationStart) {
  // @ts-expect-error TS2532 TODO(ts-error): fixme
  if (!application.capabilities.dev_tools.show) {
    application.navigateToApp('home');
    return true;
  }
  return false;
}

function setBadge(application: ApplicationStart, chrome: ChromeStart) {
  // @ts-expect-error TS2532 TODO(ts-error): fixme
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

export function MainApp(
  props: {
    onManageDataSource: () => void;
    devTools: readonly DevToolApp[];
    RouterComponent?: React.ComponentClass;
    defaultRoute?: string;
  } & Pick<
    DevToolsWrapperProps,
    | 'savedObjects'
    | 'notifications'
    | 'dataSourceEnabled'
    | 'dataSourceManagement'
    | 'useUpdatedUX'
    | 'setMenuMountPoint'
  >
) {
  const {
    onManageDataSource,
    devTools,
    savedObjects,
    notifications,
    dataSourceEnabled,
    dataSourceManagement,
    useUpdatedUX,
    setMenuMountPoint,
    RouterComponent = Router,
    defaultRoute,
  } = props;
  const defaultTool = devTools.find((devTool) => devTool.id === defaultRoute) || devTools[0];
  return (
    <I18nProvider>
      <RouterComponent>
        <Switch>
          {devTools
            // Only create routes for devtools that are not disabled
            .filter((devTool) => !devTool.isDisabled())
            .map((devTool) => (
              <Route
                key={devTool.id}
                path={`/${devTool.id}`}
                exact={!devTool.enableRouting}
                render={(routeProps) => (
                  <DevToolsWrapper
                    onManageDataSource={onManageDataSource}
                    updateRoute={routeProps.history.push}
                    activeDevTool={devTool}
                    devTools={devTools}
                    savedObjects={savedObjects}
                    notifications={notifications}
                    dataSourceEnabled={dataSourceEnabled}
                    dataSourceManagement={dataSourceManagement}
                    useUpdatedUX={useUpdatedUX}
                    setMenuMountPoint={setMenuMountPoint}
                  />
                )}
              />
            ))}
          <Route path="/">
            <Redirect to={`/${defaultTool.id}`} />
          </Route>
        </Switch>
      </RouterComponent>
    </I18nProvider>
  );
}

export function renderApp(
  { application, chrome, docLinks, savedObjects, notifications }: CoreStart,
  element: HTMLElement,
  history: ScopedHistory,
  devTools: readonly DevToolApp[],
  { dataSourceManagement, dataSource }: DevToolsSetupDependencies
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
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    <MainApp
      devTools={devTools}
      dataSourceEnabled={dataSourceEnabled}
      savedObjects={savedObjects}
      notifications={notifications}
      dataSourceManagement={dataSourceManagement}
    />,
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
