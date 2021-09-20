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
import expect from '@osd/expect';
import { UI_SETTINGS } from '../../../../src/plugins/data/common';

export default function ({ getService, getPageObjects }) {
  const browser = getService('browser');
  const globalNav = getService('globalNav');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const appsMenu = getService('appsMenu');
  const PageObjects = getPageObjects(['common', 'home', 'header', 'settings']);
  const testSubjects = getService('testSubjects');

  const expectedFullLogo =
    'https://opensearch.org/assets/brand/SVG/Logo/opensearch_logo_default.svg';
  const expectedFullLogoDarkMode =
    'https://opensearch.org/assets/brand/SVG/Logo/opensearch_logo_darkmode.svg';
  const expectedMarkLogo =
    'https://opensearch.org/assets/brand/SVG/Mark/opensearch_mark_default.svg';
  const expectedMarkLogoDarkMode =
    'https://opensearch.org/assets/brand/SVG/Mark/opensearch_mark_darkmode.svg';
  const applicationTitle = 'OpenSearch';
  const expectedWelcomeMessage = 'Welcome to OpenSearch';

  describe('OpenSearch Dashboards branding configuration', function customHomeBranding() {
    describe('should render overview page', async () => {
      this.tags('includeFirefox');

      before(async function () {
        await PageObjects.common.navigateToApp('home');
        await PageObjects.common.navigateToApp('opensearch_dashboards_overview');
      });

      it('with customized logo for opensearch overview header in default mode', async () => {
        await testSubjects.existOrFail('osdOverviewPageHeaderLogo');
        const actualLabel = await testSubjects.getAttribute(
          'osdOverviewPageHeaderLogo',
          'data-test-logo'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogo.toUpperCase());
      });

      it('with customized logo for opensearch overview header in dark mode', async () => {
        await PageObjects.common.navigateToApp('management/opensearch-dashboards/settings');
        await PageObjects.settings.toggleAdvancedSettingCheckbox('theme:darkMode');
        await PageObjects.common.navigateToApp('opensearch_dashboards_overview');
        await testSubjects.existOrFail('osdOverviewPageHeaderLogo');
        const actualLabel = await testSubjects.getAttribute(
          'osdOverviewPageHeaderLogo',
          'data-test-logo'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogoDarkMode.toUpperCase());
      });
    });

    describe('should render welcome page', async () => {
      this.tags('includeFirefox');

      //unloading any pre-existing settings so the welcome page will appear
      before(async function () {
        await opensearchArchiver.unload('logstash_functional');
        await opensearchArchiver.unload('long_window_logstash');
        await opensearchArchiver.unload('visualize');
        await PageObjects.common.navigateToApp('home');
      });

      //loading the settings again for
      after(async function () {
        await browser.setWindowSize(1280, 800);
        await opensearchArchiver.loadIfNeeded('logstash_functional');
        await opensearchArchiver.loadIfNeeded('long_window_logstash');
        await opensearchArchiver.load('visualize');
        await opensearchDashboardsServer.uiSettings.replace({
          defaultIndex: 'logstash-*',
          [UI_SETTINGS.FORMAT_BYTES_DEFAULT_PATTERN]: '0,0.[000]b',
        });
      });

      it('with customized logo', async () => {
        await testSubjects.existOrFail('welcomeCustomLogo');
        const actualLabel = await testSubjects.getAttribute(
          'welcomeCustomLogo',
          'data-test-image-url'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogo.toUpperCase());
      });

      it('with customized title', async () => {
        await testSubjects.existOrFail('welcomeCustomTitle');
        const actualLabel = await testSubjects.getAttribute(
          'welcomeCustomTitle',
          'data-test-title-message'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedWelcomeMessage.toUpperCase());
      });

      it('with customized logo in dark mode', async () => {
        await PageObjects.common.navigateToApp('management/opensearch-dashboards/settings');
        await PageObjects.settings.toggleAdvancedSettingCheckbox('theme:darkMode');
        await PageObjects.common.navigateToApp('home');
        await testSubjects.existOrFail('welcomeCustomLogo');
        const actualLabel = await testSubjects.getAttribute(
          'welcomeCustomLogo',
          'data-test-image-url'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogoDarkMode.toUpperCase());
      });
    });

    describe('should render home page', async () => {
      this.tags('includeFirefox');

      before(async function () {
        await PageObjects.common.navigateToApp('home');
      });

      after(async function () {
        await PageObjects.common.navigateToApp('management/opensearch-dashboards/settings');
        await PageObjects.settings.clearAdvancedSettings('theme:darkMode');
        await PageObjects.common.navigateToApp('home');
      });

      it('with customized logo in header bar', async () => {
        await globalNav.logoExistsOrFail(expectedFullLogo);
      });

      it('with customized logo that can take back to home page', async () => {
        await PageObjects.common.navigateToApp('settings');
        await globalNav.clickLogo();
        await PageObjects.header.waitUntilLoadingHasFinished();
        const url = await browser.getCurrentUrl();
        expect(url.includes('/app/home')).to.be(true);
      });

      it('with customized logo in home dashboard card', async () => {
        await testSubjects.existOrFail('dashboardCustomLogo');
        const actualLabel = await testSubjects.getAttribute(
          'dashboardCustomLogo',
          'data-test-image-url'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogo.toUpperCase());
      });

      it('with customized title in home dashboard card', async () => {
        await testSubjects.existOrFail('dashboardCustomTitle');
        const actualLabel = await testSubjects.getAttribute(
          'dashboardCustomTitle',
          'data-test-title'
        );
        expect(actualLabel.toUpperCase()).to.equal(applicationTitle.toUpperCase());
      });

      it('with customized logo for opensearch in side menu', async () => {
        await appsMenu.openCollapsibleNav();
        await testSubjects.existOrFail('collapsibleNavGroup-opensearchDashboards');
        const actualLabel = await testSubjects.getAttribute(
          'collapsibleNavGroup-opensearchDashboards',
          'data-test-opensearch-logo'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogo.toUpperCase());
      });

      it('with customized logo in header bar in dark mode', async () => {
        await PageObjects.common.navigateToApp('management/opensearch-dashboards/settings');
        await PageObjects.settings.toggleAdvancedSettingCheckbox('theme:darkMode');
        await PageObjects.common.navigateToApp('home');
        await globalNav.logoExistsOrFail(expectedFullLogoDarkMode);
      });

      it('with customized logo that can take back to home page in dark mode', async () => {
        await PageObjects.common.navigateToApp('settings');
        await globalNav.clickLogo();
        await PageObjects.header.waitUntilLoadingHasFinished();
        const url = await browser.getCurrentUrl();
        expect(url.includes('/app/home')).to.be(true);
      });

      it('with customized logo in home dashboard card in dark mode', async () => {
        await testSubjects.existOrFail('dashboardCustomLogo');
        const actualLabel = await testSubjects.getAttribute(
          'dashboardCustomLogo',
          'data-test-image-url'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogoDarkMode.toUpperCase());
      });

      it('with customized logo for opensearch in side menu in dark mode', async () => {
        await appsMenu.openCollapsibleNav();
        await testSubjects.existOrFail('collapsibleNavGroup-opensearchDashboards');
        const actualLabel = await testSubjects.getAttribute(
          'collapsibleNavGroup-opensearchDashboards',
          'data-test-opensearch-logo'
        );
        expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogoDarkMode.toUpperCase());
      });
    });
  });
}
