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

  describe('custom doc views links', function () {
    beforeEach(async () => {
      await PageObjects.common.navigateToApp('discover');
      await PageObjects.timePicker.setDefaultAbsoluteRange();
      await testSubjects.click('docTableExpandToggleColumn');
    });

    it('should show href doc views link', async () => {
      const hrefLink = await find.byLinkText('href doc view link');
      await find.byLinkText('generateurlcb doc view link');

      expect(await hrefLink.isDisplayed()).to.be(true);
    });

    it('should render href doc view link', async () => {
      const hrefLink = await find.byLinkText('href doc view link');
      await hrefLink.click();
      expect(await browser.getCurrentUrl()).to.eql('http://some-url/');
    });

    it('should render react doc view', async () => {
      const generateurlcbLink = await find.byLinkText('generateurlcb doc view link');
      await generateurlcbLink.click();
      expect(await browser.getCurrentUrl()).to.eql('http://some-url/');
    });
  });
}
