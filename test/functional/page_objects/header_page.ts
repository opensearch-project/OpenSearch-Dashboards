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

import { FtrProviderContext } from '../ftr_provider_context';

export function HeaderPageProvider({ getService, getPageObjects }: FtrProviderContext) {
  const config = getService('config');
  const log = getService('log');
  const retry = getService('retry');
  const testSubjects = getService('testSubjects');
  const appsMenu = getService('appsMenu');
  const globalNav = getService('globalNav');
  const PageObjects = getPageObjects(['common']);

  const defaultFindTimeout = config.get('timeouts.find');

  class HeaderPage {
    public async clickDiscover() {
      await appsMenu.clickLink('Discover', { category: 'opensearchDashboards' });
      await PageObjects.common.waitForTopNavToBeVisible();
      await this.awaitGlobalLoadingIndicatorHidden();
    }

    public async clickVisualize() {
      await appsMenu.clickLink('Visualize', { category: 'opensearchDashboards' });
      await this.awaitGlobalLoadingIndicatorHidden();
      await retry.waitFor('first breadcrumb to be "Visualize"', async () => {
        const firstBreadcrumb = await globalNav.getFirstBreadcrumb();
        if (firstBreadcrumb !== 'Visualize') {
          log.debug('-- first breadcrumb =', firstBreadcrumb);
          return false;
        }

        return true;
      });
    }

    public async clickDashboard() {
      await appsMenu.clickLink('Dashboard', { category: 'opensearchDashboards' });
      await retry.waitFor('dashboard app to be loaded', async () => {
        const isNavVisible = await testSubjects.exists('top-nav');
        const isLandingPageVisible = await testSubjects.exists('dashboardLandingPage');
        return isNavVisible || isLandingPageVisible;
      });
      await this.awaitGlobalLoadingIndicatorHidden();
    }

    public async clickStackManagement() {
      await appsMenu.clickLink('Dashboards Management', { category: 'management' });
      await this.awaitGlobalLoadingIndicatorHidden();
    }

    public async waitUntilLoadingHasFinished() {
      try {
        await this.isGlobalLoadingIndicatorVisible();
      } catch (exception) {
        if (exception.name === 'ElementNotVisible') {
          // selenium might just have been too slow to catch it
        } else {
          throw exception;
        }
      }
      await this.awaitGlobalLoadingIndicatorHidden();
    }

    public async isGlobalLoadingIndicatorVisible() {
      log.debug('isGlobalLoadingIndicatorVisible');
      return await testSubjects.exists('globalLoadingIndicator', { timeout: 1500 });
    }

    public async awaitGlobalLoadingIndicatorHidden() {
      await testSubjects.existOrFail('globalLoadingIndicator-hidden', {
        allowHidden: true,
        timeout: defaultFindTimeout * 10,
      });
    }

    public async awaitOpenSearchDashboardsChrome() {
      log.debug('awaitOpenSearchDashboardsChrome');
      await testSubjects.find('opensearchDashboardsChrome', defaultFindTimeout * 10);
    }
  }

  return new HeaderPage();
}
