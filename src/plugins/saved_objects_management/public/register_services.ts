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

import { StartServicesAccessor } from '../../../core/public';
import { SavedObjectsManagementPluginStart, StartDependencies } from './plugin';
import { ISavedObjectsManagementServiceRegistry } from './services';

export const registerServices = async (
  registry: ISavedObjectsManagementServiceRegistry,
  getStartServices: StartServicesAccessor<StartDependencies, SavedObjectsManagementPluginStart>
) => {
  const [
    ,
    { home, dashboard, explore, visualizations, visAugmenter, discover, visBuilder },
  ] = await getStartServices();

  if (home) {
    registry.register({
      id: 'savedHomepage',
      title: 'homepage',
      service: home.getSavedHomepageLoader(),
    });
  }

  if (dashboard) {
    registry.register({
      id: 'savedDashboards',
      title: 'dashboards',
      service: dashboard.getSavedDashboardLoader(),
    });
  }

  if (visualizations) {
    registry.register({
      id: 'savedVisualizations',
      title: 'visualizations',
      service: visualizations.savedVisualizationsLoader,
    });
  }

  if (visAugmenter) {
    registry.register({
      id: 'savedAugmentVis',
      title: 'augmentVis',
      service: visAugmenter.savedAugmentVisLoader,
    });
  }

  if (discover) {
    registry.register({
      id: 'savedSearches',
      title: 'searches',
      service: discover.savedSearchLoader,
    });
  }

  if (explore) {
    registry.register({
      id: 'savedExplore',
      title: 'explore',
      service: explore.savedExploreLoader as any,
    });
  }

  if (visBuilder) {
    registry.register({
      id: 'savedVisBuilder',
      title: 'visBuilder',
      service: visBuilder.savedVisBuilderLoader,
    });
  }
};
