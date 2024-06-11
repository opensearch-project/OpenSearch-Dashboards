/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { PluginFunctionalProviderContext } from '../../services';

export default function ({ getService, getPageObjects }: PluginFunctionalProviderContext) {
  const testSubjects = getService('testSubjects');
  const find = getService('find');
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common', 'discover', 'timePicker']);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitFor = async (conditionFunction, timeoutMs = 10000, intervalMs = 100) => {
    const start = Date.now();

    let lastError;
    while (Date.now() - start < timeoutMs) {
      try {
        if (await conditionFunction()) {
          return;
        }
      } catch (error) {
        lastError = error;
      }

      await sleep(intervalMs);
    }

    throw new Error(
      `waitFor condition did not become true within ${timeoutMs}ms. Last error: ${
        lastError && lastError.message
      }`
    );
  };

  describe('custom doc views links', function () {
    beforeEach(async () => {
      await PageObjects.common.navigateToApp('discover');
      // TODO: change back to setDefaultRange() once we resolve
      // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5241
      await PageObjects.timePicker.setDefaultRangeForDiscover();
      await testSubjects.click('docTableExpandToggleColumn-0');
    });

    it('should show href and generateCb doc views link and not show generateCbHidden doc views link', async () => {
      const hrefLink = await find.byLinkText('href doc view link');
      const generateCbLink = await find.byLinkText('generateCb doc view link');
      expect(await hrefLink.isDisplayed()).to.be(true);
      expect(await generateCbLink.isDisplayed()).to.be(true);
      expect(await find.existsByLinkText('generateCbHidden doc view link')).to.eql(false);
    });

    it('should render href doc view link', async () => {
      const hrefLink = await find.byLinkText('href doc view link');
      const originalTabCount = (await browser.getAllWindowHandles()).length;
      await hrefLink.click();

      // wait until a new tab is opened
      await waitFor(async () => (await browser.getAllWindowHandles()).length > originalTabCount);

      // switch to the originalTabCount in case previous tab is not closed in time
      await browser.switchTab(originalTabCount);

      const currentUrl = await browser.getCurrentUrl();
      expect(currentUrl).to.eql('http://some-url/');

      // close new tab and switch back to original tab
      await browser.closeCurrentWindow();
      await browser.switchTab(0);
    });

    it('should render generateCb doc view link', async () => {
      const generateCbLink = await find.byLinkText('generateCb doc view link');
      const originalTabCount = (await browser.getAllWindowHandles()).length;
      await generateCbLink.click();

      // wait until a new tab is opened
      await waitFor(async () => (await browser.getAllWindowHandles()).length > originalTabCount);

      // switch to the originalTabCount in case previous tab is not closed in time
      await browser.switchTab(originalTabCount);

      const currentUrl = await browser.getCurrentUrl();
      expect(currentUrl).to.eql('http://some-url/');

      // close new tab and switch back to original tab
      await browser.closeCurrentWindow();
      await browser.switchTab(0);
    });
  });
}
