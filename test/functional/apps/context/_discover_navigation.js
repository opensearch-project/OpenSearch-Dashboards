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

import expect from '@osd/expect';

const TEST_COLUMN_NAMES = ['@message'];
const TEST_FILTER_COLUMN_NAMES = [
  ['extension', 'jpg'],
  ['geo.src', 'IN'],
];

export default function ({ getService, getPageObjects }) {
  const browser = getService('browser');
  const dataGrid = getService('dataGrid');
  const filterBar = getService('filterBar');
  const PageObjects = getPageObjects(['common', 'discover', 'timePicker']);
  const testSubjects = getService('testSubjects');

  describe('context link in discover', () => {
    before(async () => {
      await PageObjects.timePicker.setDefaultAbsoluteRangeViaUiSettings();
      await PageObjects.common.navigateToApp('discover');

      for (const columnName of TEST_COLUMN_NAMES) {
        await PageObjects.discover.clickFieldListItemAdd(columnName);
      }

      for (const [columnName, value] of TEST_FILTER_COLUMN_NAMES) {
        await PageObjects.discover.clickFieldListItemDetails(columnName);
        await PageObjects.discover.clickFieldListPlusFilter(columnName, value);
      }
    });
    after(async () => {
      await PageObjects.timePicker.resetDefaultAbsoluteRangeViaUiSettings();
    });

    it('should open the context view with the selected document as anchor', async () => {
      // get the timestamps
      const dataGridTableTimeStamps = await dataGrid.getDataGridTableColumn('date');

      // click inspect row
      await testSubjects.click('docTableExpandToggleColumn-10');

      // click view surrounding documents
      await testSubjects.click('docTableRowAction-0');

      //navigate to the new window and get the new timestamp
      await testSubjects.exists('docTable');
      await browser.switchTab(1);
      const surroundingTableTimeStamps = await dataGrid.getDataGridTableColumn('date');

      return dataGridTableTimeStamps[10] === surroundingTableTimeStamps[5];
    });

    it('should open the context view with the same columns', async () => {
      const data = await dataGrid.getDataGridTableData();

      expect(data.columns).to.eql(['', 'Time (@timestamp)', ...TEST_COLUMN_NAMES]);
    });

    it('should open the context view with the filters disabled', async () => {
      let disabledFilterCounter = 0;
      for (const [columnName, value] of TEST_FILTER_COLUMN_NAMES) {
        if (await filterBar.hasFilter(columnName, value, false)) {
          disabledFilterCounter++;
        }
      }
      expect(disabledFilterCounter).to.be(TEST_FILTER_COLUMN_NAMES.length);
      //close the new tab and get back to the old tab
      await browser.closeCurrentWindow();
      await browser.switchTab(0);

      await testSubjects.click('euiFlyoutCloseButton');
    });
  });
}
