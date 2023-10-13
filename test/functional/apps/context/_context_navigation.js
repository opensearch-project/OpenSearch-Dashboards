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

const TEST_FILTER_COLUMN_NAMES = [
  [
    'agent',
    'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.50 Safari/534.24',
  ],
  ['extension', 'jpg'],
];

export default function ({ getService, getPageObjects }) {
  const retry = getService('retry');
  const browser = getService('browser');
  const testSubjects = getService('testSubjects');
  const PageObjects = getPageObjects(['common', 'context', 'discover', 'timePicker']);

  describe('discover - context - back navigation', function contextSize() {
    before(async function () {
      await PageObjects.timePicker.setDefaultAbsoluteRangeViaUiSettings();
      await PageObjects.common.navigateToApp('discover');
      for (const [columnName, value] of TEST_FILTER_COLUMN_NAMES) {
        await PageObjects.discover.clickFieldListItemDetails(columnName);
        await PageObjects.discover.clickFieldListPlusFilter(columnName, value);
      }
    });

    it('should open a new tab after loading surrounding documents', async function () {
      await retry.waitFor('user navigating to context', async () => {
        const initialHitCount = await PageObjects.discover.getHitCount();

        // click inspect row
        await testSubjects.click('docTableExpandToggleColumn-0');
        // click view surrounding documents
        await testSubjects.click('docTableRowAction-0');

        //navigate to the new window
        await testSubjects.exists('docTable');
        await browser.switchTab(1);

        //close the new tab and get back to the old tab
        await browser.closeCurrentWindow();
        await browser.switchTab(0);

        await testSubjects.click('euiFlyoutCloseButton');
        const hitCount = await PageObjects.discover.getHitCount();
        return initialHitCount === hitCount;
      });
    });
  });
}
