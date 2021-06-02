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

import moment from 'moment';
import { Subscription } from 'rxjs';
import { History } from 'history';

import { ViewMode } from 'src/plugins/embeddable/public';
import { IIndexPattern, TimeRange, Query, Filter, SavedQuery } from 'src/plugins/data/public';
import { IOsdUrlStateStorage } from 'src/plugins/opensearch-dashboards-utils/public';

import { DashboardAppState, SavedDashboardPanel } from '../types';
import { DashboardAppController } from './dashboard_app_controller';
import { RenderDeps } from './application';
import { SavedObjectDashboard } from '../saved_dashboards';

export interface DashboardAppScope extends ng.IScope {
  dash: SavedObjectDashboard;
  appState: DashboardAppState;
  model: {
    query: Query;
    filters: Filter[];
    timeRestore: boolean;
    title: string;
    description: string;
    timeRange:
      | TimeRange
      | { to: string | moment.Moment | undefined; from: string | moment.Moment | undefined };
    refreshInterval: any;
  };
  savedQuery?: SavedQuery;
  refreshInterval: any;
  panels: SavedDashboardPanel[];
  indexPatterns: IIndexPattern[];
  dashboardViewMode: ViewMode;
  expandedPanel?: string;
  getShouldShowEditHelp: () => boolean;
  getShouldShowViewHelp: () => boolean;
  handleRefresh: (
    { query, dateRange }: { query?: Query; dateRange: TimeRange },
    isUpdate?: boolean
  ) => void;
  topNavMenu: any;
  showAddPanel: any;
  showSaveQuery: boolean;
  osdTopNav: any;
  enterEditMode: () => void;
  timefilterSubscriptions$: Subscription;
  isVisible: boolean;
}

export function initDashboardAppDirective(app: any, deps: RenderDeps) {
  app.directive('dashboardApp', () => ({
    restrict: 'E',
    controllerAs: 'dashboardApp',
    controller: (
      $scope: DashboardAppScope,
      $route: any,
      $routeParams: {
        id?: string;
      },
      osdUrlStateStorage: IOsdUrlStateStorage,
      history: History
    ) =>
      new DashboardAppController({
        $route,
        $scope,
        $routeParams,
        indexPatterns: deps.data.indexPatterns,
        osdUrlStateStorage,
        history,
        ...deps,
      }),
  }));
}
