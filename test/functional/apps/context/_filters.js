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

const TEST_INDEX_PATTERN = 'logstash-*';
const TEST_ANCHOR_ID = 'AU_x3_BrGFA8no6QjjaI';
const TEST_ANCHOR_FILTER_FIELD = 'geo.src';
const TEST_ANCHOR_FILTER_VALUE = 'IN';
const TEST_COLUMN_NAMES = ['extension', 'geo.src'];

export default function ({ getService, getPageObjects }) {
  const dataGrid = getService('dataGrid');
  const filterBar = getService('filterBar');
  const retry = getService('retry');
  const browser = getService('browser');
  const testSubjects = getService('testSubjects');

  const PageObjects = getPageObjects(['common', 'context']);

  describe('context filters', function contextSize() {
    beforeEach(async function () {
      await browser.refresh();
      await PageObjects.context.navigateTo(TEST_INDEX_PATTERN, TEST_ANCHOR_ID, {
        columns: TEST_COLUMN_NAMES,
      });
    });

    it('inclusive filter should be addable via expanded doc table rows', async function () {
      await retry.waitFor(`filter ${TEST_ANCHOR_FILTER_FIELD} in filterbar`, async () => {
        // expand anchor row
        await testSubjects.click('docTableExpandToggleColumn-5');

        // add inclusive filter
        await testSubjects.click(
          `tableDocViewRow-${TEST_ANCHOR_FILTER_FIELD} > addInclusiveFilterButton`
        );

        return await filterBar.hasFilter(TEST_ANCHOR_FILTER_FIELD, TEST_ANCHOR_FILTER_VALUE, true);
      });
      await retry.waitFor(`filter matching docs in docTable`, async () => {
        const fields = await dataGrid.getDataGridTableColumn('lastColumn');
        return fields.every((fieldContent) => fieldContent === TEST_ANCHOR_FILTER_VALUE);
      });
    });

    it('inclusive filter should be toggleable via the filter bar', async function () {
      await filterBar.addFilter(TEST_ANCHOR_FILTER_FIELD, 'IS', TEST_ANCHOR_FILTER_VALUE);
      await PageObjects.context.waitUntilContextLoadingHasFinished();
      // disable filter
      await filterBar.toggleFilterEnabled(TEST_ANCHOR_FILTER_FIELD);
      await PageObjects.context.waitUntilContextLoadingHasFinished();

      await retry.waitFor(`a disabled filter in filterbar`, async () => {
        return await filterBar.hasFilter(TEST_ANCHOR_FILTER_FIELD, TEST_ANCHOR_FILTER_VALUE, false);
      });

      await retry.waitFor('filters are disabled', async () => {
        const fields = await dataGrid.getDataGridTableColumn('lastColumn');
        const hasOnlyFilteredRows = fields.every(
          (fieldContent) => fieldContent === TEST_ANCHOR_FILTER_VALUE
        );
        return hasOnlyFilteredRows === false;
      });
    });

    it('filter for presence should be addable via expanded doc table rows', async function () {
      // expand anchor row
      await testSubjects.click('docTableExpandToggleColumn-5');

      await retry.waitFor('an exists filter in the filterbar', async () => {
        // add inclusive filter
        await testSubjects.click(
          `tableDocViewRow-${TEST_ANCHOR_FILTER_FIELD} > addExistsFilterButton`
        );
        return await filterBar.hasFilter(TEST_ANCHOR_FILTER_FIELD, 'exists', true);
      });
    });
  });
}
