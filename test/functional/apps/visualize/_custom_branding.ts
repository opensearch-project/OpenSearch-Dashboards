/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { FtrProviderContext } from '../../ftr_provider_context';
import { UI_SETTINGS } from '../../../../src/plugins/data/common';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
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
        await PageObjects.settings.navigateTo();
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

      // unloading any pre-existing settings so the welcome page will appear
      before(async function () {
        await opensearchArchiver.unload('logstash_functional');
        await opensearchArchiver.unload('long_window_logstash');
        await opensearchArchiver.unload('visualize');
        await PageObjects.common.navigateToApp('home');
      });

      // loading the settings again for
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
        await PageObjects.settings.navigateTo();
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
        await PageObjects.common.navigateToApp('home');
      });

      describe('in default mode', async () => {
        it('with customized logo in header bar', async () => {
          await globalNav.logoExistsOrFail(expectedFullLogo);
        });

        it('with customized mark logo button in header bar', async () => {
          await globalNav.homeMarkExistsOrFail(expectedMarkLogo);
        });

        it('with customized logo button that navigates to home page', async () => {
          await PageObjects.common.navigateToApp('settings');
          await globalNav.clickLogo();
          await PageObjects.header.waitUntilLoadingHasFinished();
          const url = await browser.getCurrentUrl();
          expect(url.includes('/app/home')).to.be(true);
        });

        it('with customized mark logo button that navigates to home page', async () => {
          await PageObjects.common.navigateToApp('settings');
          await globalNav.clickHomeButton();
          await PageObjects.header.waitUntilLoadingHasFinished();
          const url = await browser.getCurrentUrl();
          expect(url.includes('/app/home')).to.be(true);
        });

        it('with customized mark logo in home dashboard card', async () => {
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

        it('with customized mark logo for opensearch in side menu', async () => {
          await appsMenu.openCollapsibleNav();
          await testSubjects.existOrFail('collapsibleNavGroup-opensearchDashboards');
          const actualLabel = await testSubjects.getAttribute(
            'collapsibleNavGroup-opensearchDashboards',
            'data-test-opensearch-logo'
          );
          expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogo.toUpperCase());
        });
      });

      describe('in dark mode', async () => {
        before(async function () {
          await PageObjects.settings.navigateTo();
          await PageObjects.settings.toggleAdvancedSettingCheckbox('theme:darkMode');
          await PageObjects.common.navigateToApp('home');
        });

        after(async function () {
          await PageObjects.settings.navigateTo();
          await PageObjects.settings.clearAdvancedSettings('theme:darkMode');
        });

        it('with customized logo in header bar', async () => {
          await globalNav.logoExistsOrFail(expectedFullLogoDarkMode);
        });

        it('with customized mark logo button in header bar', async () => {
          await globalNav.homeMarkExistsOrFail(expectedMarkLogoDarkMode);
        });

        it('with customized logo that navigates to home page', async () => {
          await PageObjects.common.navigateToApp('settings');
          await globalNav.clickLogo();
          await PageObjects.header.waitUntilLoadingHasFinished();
          const url = await browser.getCurrentUrl();
          expect(url.includes('/app/home')).to.be(true);
        });

        it('with customized mark logo button that navigates to home page', async () => {
          await PageObjects.settings.navigateTo();
          await globalNav.clickHomeButton();
          await PageObjects.header.waitUntilLoadingHasFinished();
          const url = await browser.getCurrentUrl();
          expect(url.includes('/app/home')).to.be(true);
        });

        it('with customized mark logo in home dashboard card', async () => {
          await testSubjects.existOrFail('dashboardCustomLogo');
          const actualLabel = await testSubjects.getAttribute(
            'dashboardCustomLogo',
            'data-test-image-url'
          );
          expect(actualLabel.toUpperCase()).to.equal(expectedMarkLogoDarkMode.toUpperCase());
        });

        it('with customized mark logo for opensearch in side menu', async () => {
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
  });
}
