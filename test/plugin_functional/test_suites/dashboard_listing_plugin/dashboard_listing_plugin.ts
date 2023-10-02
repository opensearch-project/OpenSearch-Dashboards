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

import url from 'url';
import expect from '@osd/expect';

const getPathWithHash = (absoluteUrl: string) => {
  const parsed = url.parse(absoluteUrl);
  return `${parsed.path}${parsed.hash ?? ''}`;
};

export default function ({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const PageObjects = getPageObjects(['common', 'dashboard', 'header']);
  const browser = getService('browser');
  const listingTable = getService('listingTable');
  const find = getService('find');

  describe('dashboard listing plugin', function describeIndexTests() {
    const dashboardName = 'Dashboard Test';

    before(async () => {
      await PageObjects.dashboard.initTests({
        opensearchDashboardsIndex: '../functional/fixtures/opensearch_archiver/dashboard/legacy',
      });
      await PageObjects.dashboard.clickCreateDashboardPrompt();
      await PageObjects.dashboard.saveDashboard('default');
      await PageObjects.dashboard.gotoDashboardLandingPage();
    });

    it('should be able to navigate to create a dashboard', async () => {
      await testSubjects.click('createMenuDropdown');
      await testSubjects.click('contextMenuItem-dashboard');
      await PageObjects.dashboard.saveDashboard(dashboardName);

      await PageObjects.dashboard.gotoDashboardLandingPage();
      await listingTable.searchAndExpectItemsCount('dashboard', dashboardName, 1);
    });

    it('should be able to navigate to view dashboard', async () => {
      await listingTable.clickItemLink('dashboard', dashboardName);
      await PageObjects.header.awaitGlobalLoadingIndicatorHidden();
      await PageObjects.dashboard.getIsInViewMode();
      await PageObjects.dashboard.gotoDashboardLandingPage();
    });

    it('should be able to navigate to edit dashboard', async () => {
      await listingTable.searchForItemWithName(dashboardName);
      const editBttn = await find.allByCssSelector('.euiToolTipAnchor');
      await editBttn[0].click();
      await PageObjects.dashboard.clickCancelOutOfEditMode();
      await PageObjects.dashboard.gotoDashboardLandingPage();
    });

    it('should be able to navigate to create a test dashboard', async () => {
      await testSubjects.click('createMenuDropdown');
      await testSubjects.click('contextMenuItem-dashboard_listing_test_plugin');
      expect(getPathWithHash(await browser.getCurrentUrl())).to.eql(
        '/app/dashboard_listing_test_plugin#/create'
      );
    });
  });
}
