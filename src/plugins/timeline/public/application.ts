/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import './index.scss';

import { EuiIcon } from '@elastic/eui';
import angular, { IModule } from 'angular';
// required for `ngSanitize` angular module
import 'angular-sanitize';
// required for ngRoute
import 'angular-route';
import 'angular-sortable-view';
import { i18nDirective, i18nFilter, I18nProvider } from '@osd/i18n/angular';
import {
  IUiSettingsClient,
  CoreStart,
  PluginInitializerContext,
  AppMountParameters,
} from 'opensearch-dashboards/public';
import { getTimeChart } from './panels/timechart/timechart';
import { Panel } from './panels/panel';

import {
  configureAppAngularModule,
  createTopNavDirective,
  createTopNavHelper,
} from '../../opensearch_dashboards_legacy/public';
import { TimelinePluginDependencies } from './plugin';
import { DataPublicPluginStart } from '../../data/public';
// @ts-ignore
import { initTimelineApp } from './app';

export interface RenderDeps {
  pluginInitializerContext: PluginInitializerContext;
  mountParams: AppMountParameters;
  core: CoreStart;
  plugins: TimelinePluginDependencies;
  timelinePanels: Map<string, Panel>;
}

export interface TimelineVisualizationDependencies {
  uiSettings: IUiSettingsClient;
  timelinePanels: Map<string, Panel>;
  data: DataPublicPluginStart;
  $rootScope: any;
  $compile: any;
}

let angularModuleInstance: IModule | null = null;

export const renderApp = (deps: RenderDeps) => {
  if (!angularModuleInstance) {
    angularModuleInstance = createLocalAngularModule(deps);
    // global routing stuff
    configureAppAngularModule(
      angularModuleInstance,
      { core: deps.core, env: deps.pluginInitializerContext.env },
      true
    );
    initTimelineApp(angularModuleInstance, deps);
  }

  const $injector = mountTimelineApp(deps.mountParams.appBasePath, deps.mountParams.element, deps);

  return () => {
    $injector.get('$rootScope').$destroy();
  };
};

function registerPanels(dependencies: TimelineVisualizationDependencies) {
  const timeChartPanel: Panel = getTimeChart(dependencies);

  dependencies.timelinePanels.set(timeChartPanel.name, timeChartPanel);
}

const mainTemplate = (basePath: string) => `<div ng-view class="timelineAppContainer">
  <base href="${basePath}" />
</div>`;

const moduleName = 'app/timeline';

const thirdPartyAngularDependencies = ['ngSanitize', 'ngRoute', 'react', 'angular-sortable-view'];

function mountTimelineApp(appBasePath: string, element: HTMLElement, deps: RenderDeps) {
  const mountpoint = document.createElement('div');
  mountpoint.setAttribute('class', 'timelineAppContainer');
  // eslint-disable-next-line no-unsanitized/property
  mountpoint.innerHTML = mainTemplate(appBasePath);
  // bootstrap angular into detached element and attach it later to
  // make angular-within-angular possible
  const $injector = angular.bootstrap(mountpoint, [moduleName]);

  registerPanels({
    uiSettings: deps.core.uiSettings,
    timelinePanels: deps.timelinePanels,
    data: deps.plugins.data,
    $rootScope: $injector.get('$rootScope'),
    $compile: $injector.get('$compile'),
  });
  element.appendChild(mountpoint);
  return $injector;
}

function createLocalAngularModule(deps: RenderDeps) {
  createLocalI18nModule();
  createLocalIconModule();
  createLocalTopNavModule(deps.plugins.navigation);

  const dashboardAngularModule = angular.module(moduleName, [
    ...thirdPartyAngularDependencies,
    'app/timeline/TopNav',
    'app/timeline/I18n',
    'app/timeline/icon',
  ]);
  return dashboardAngularModule;
}

function createLocalIconModule() {
  angular
    .module('app/timeline/icon', ['react'])
    .directive('icon', (reactDirective) => reactDirective(EuiIcon));
}

function createLocalTopNavModule(navigation: TimelinePluginDependencies['navigation']) {
  angular
    .module('app/timeline/TopNav', ['react'])
    .directive('osdTopNav', createTopNavDirective)
    .directive('osdTopNavHelper', createTopNavHelper(navigation.ui));
}

function createLocalI18nModule() {
  angular
    .module('app/timeline/I18n', [])
    .provider('i18n', I18nProvider)
    .filter('i18n', i18nFilter)
    .directive('i18nId', i18nDirective);
}
