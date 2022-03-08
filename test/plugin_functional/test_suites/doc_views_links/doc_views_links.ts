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

    it('should show href and generateCb doc views link', async () => {
      const hrefLink = await find.byLinkText('href doc view link');
      const generateCbLink = await find.byLinkText('generateCb doc view link');

      expect(await hrefLink.isDisplayed()).to.be(true);
      expect(await generateCbLink.isDisplayed()).to.be(true);
    });

    it('should not render generateCbHidden doc views link', async () => {
      expect(await find.existsByLinkText('generateCbHidden doc view link')).to.eql(false);
    });

    it('should render href doc view link', async () => {
      const hrefLink = await find.byLinkText('href doc view link');
      await hrefLink.click();
      expect(await browser.getCurrentUrl()).to.eql('http://some-url/');
    });

    it('should render generateCb doc view link', async () => {
      const generateCbLink = await find.byLinkText('generateCb doc view link');
      await generateCbLink.click();
      expect(await browser.getCurrentUrl()).to.eql('http://some-url/');
    });
  });
}
