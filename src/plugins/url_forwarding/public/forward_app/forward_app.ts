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

import { App, AppMountParameters, CoreSetup } from 'opensearch-dashboards/public';
import { AppNavLinkStatus } from '../../../../core/public';
import { navigateToLegacyOpenSearchDashboardsUrl } from './navigate_to_legacy_opensearch_dashboards_url';
import { ForwardDefinition, UrlForwardingStart } from '../plugin';

export const createLegacyUrlForwardApp = (
  core: CoreSetup<{}, UrlForwardingStart>,
  forwards: ForwardDefinition[]
): App => ({
  id: 'kibana',
  chromeless: true,
  title: 'Legacy URL migration',
  appRoute: '/app/kibana#/',
  navLinkStatus: AppNavLinkStatus.hidden,
  async mount(params: AppMountParameters) {
    const hash = params.history.location.hash.substr(1);

    if (!hash) {
      const [, , opensearchDashboardsLegacyStart] = await core.getStartServices();
      opensearchDashboardsLegacyStart.navigateToDefaultApp();
    }

    const [
      {
        application,
        http: { basePath },
      },
    ] = await core.getStartServices();

    const result = await navigateToLegacyOpenSearchDashboardsUrl(
      hash,
      forwards,
      basePath,
      application
    );

    if (!result.navigated) {
      const [, , opensearchDashboardsLegacyStart] = await core.getStartServices();
      opensearchDashboardsLegacyStart.navigateToDefaultApp();
    }

    return () => {};
  },
});

export const createLegacyUrlForwardCurrentApp = (
  core: CoreSetup<{}, UrlForwardingStart>,
  forwards: ForwardDefinition[]
): App => ({
  id: 'opensearch-dashboards',
  chromeless: true,
  title: 'Legacy URL migration',
  appRoute: '/app/opensearch-dashboards#/',
  navLinkStatus: AppNavLinkStatus.hidden,
  async mount(params: AppMountParameters) {
    const hash = params.history.location.hash.substr(1);

    if (!hash) {
      const [, , opensearchDashboardsLegacyStart] = await core.getStartServices();
      opensearchDashboardsLegacyStart.navigateToDefaultApp();
    }

    const [
      {
        application,
        http: { basePath },
      },
    ] = await core.getStartServices();

    const result = await navigateToLegacyOpenSearchDashboardsUrl(
      hash,
      forwards,
      basePath,
      application
    );

    if (!result.navigated) {
      const [, , opensearchDashboardsLegacyStart] = await core.getStartServices();
      opensearchDashboardsLegacyStart.navigateToDefaultApp();
    }

    return () => {};
  },
});
