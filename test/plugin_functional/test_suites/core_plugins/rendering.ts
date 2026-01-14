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

import { jestExpect as expect } from '@jest/expect';

import '../../plugins/core_provider_plugin/types';
import { PluginFunctionalProviderContext } from '../../services';

declare global {
  interface Window {
    /**
     * We use this global variable to track page history changes to ensure that
     * navigation is done without causing a full page reload.
     */
    __RENDERING_SESSION__: string[];
  }
}

export default function ({ getService }: PluginFunctionalProviderContext) {
  const appsMenu = getService('appsMenu');
  const browser = getService('browser');
  const deployment = getService('deployment');
  const find = getService('find');
  const testSubjects = getService('testSubjects');

  const navigateTo = async (path: string) =>
    await browser.navigateTo(`${deployment.getHostPort()}${path}`);
  const navigateToApp = async (title: string) => {
    await appsMenu.clickLink(title);
    return browser.execute(() => {
      if (!('__RENDERING_SESSION__' in window)) {
        window.__RENDERING_SESSION__ = [];
      }

      window.__RENDERING_SESSION__.push(window.location.pathname);
    });
  };

  const getUserSettings = () =>
    browser.execute(() => {
      return JSON.parse(document.querySelector('osd-injected-metadata')!.getAttribute('data')!)
        .legacyMetadata.uiSettings.user;
    });
  const exists = (selector: string) => testSubjects.exists(selector, { timeout: 5000 });
  const findLoadingMessage = () => testSubjects.find('osdLoadingMessage', 5000);
  const getRenderingSession = () =>
    browser.execute(() => {
      return window.__RENDERING_SESSION__;
    });

  // Talked to @dover, he aggreed we can skip these tests that are unexpectedly flaky
  describe.skip('rendering service', () => {
    it('renders "core" application', async () => {
      await navigateTo('/render/core');

      const [loadingMessage, userSettings] = await Promise.all([
        findLoadingMessage(),
        getUserSettings(),
      ]);

      expect(userSettings).not.toBe('');

      await find.waitForElementStale(loadingMessage);

      expect(await exists('renderingHeader')).toBe(true);
    });

    it('renders "core" application without user settings', async () => {
      await navigateTo('/render/core?includeUserSettings=false');

      const [loadingMessage, userSettings] = await Promise.all([
        findLoadingMessage(),
        getUserSettings(),
      ]);

      expect(userSettings).toBe('');

      await find.waitForElementStale(loadingMessage);

      expect(await exists('renderingHeader')).toBe(true);
    });

    it('navigates between standard application and one with custom appRoute', async () => {
      await navigateTo('/');
      await find.waitForElementStale(await findLoadingMessage());

      await navigateToApp('App Status');
      expect(await exists('appStatusApp')).toBe(true);
      expect(await exists('renderingHeader')).toBe(false);

      await navigateToApp('Rendering');
      expect(await exists('appStatusApp')).toBe(false);
      expect(await exists('renderingHeader')).toBe(true);

      await navigateToApp('App Status');
      expect(await exists('appStatusApp')).toBe(true);
      expect(await exists('renderingHeader')).toBe(false);

      expect(await getRenderingSession()).toEqual([
        '/app/app_status',
        '/render/core',
        '/app/app_status',
      ]);
    });

    it('navigates between applications with custom appRoutes', async () => {
      await navigateTo('/');
      await find.waitForElementStale(await findLoadingMessage());

      await navigateToApp('Rendering');
      expect(await exists('renderingHeader')).toBe(true);
      expect(await exists('customAppRouteHeader')).toBe(false);

      await navigateToApp('Custom App Route');
      expect(await exists('customAppRouteHeader')).toBe(true);
      expect(await exists('renderingHeader')).toBe(false);

      await navigateToApp('Rendering');
      expect(await exists('renderingHeader')).toBe(true);
      expect(await exists('customAppRouteHeader')).toBe(false);

      expect(await getRenderingSession()).toEqual([
        '/render/core',
        '/custom/appRoute',
        '/render/core',
      ]);
    });
  });
}
