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

export default function ({ getService, getPageObjects }) {
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const retry = getService('retry');
  const PageObjects = getPageObjects(['settings', 'common']);

  describe('index result field sort', function describeIndexTests() {
    before(async function () {
      // delete .kibana index and then wait for OpenSearch Dashboards to re-create it
      await opensearchDashboardsServer.uiSettings.replace({});
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.createIndexPattern();
    });

    after(async function () {
      return await PageObjects.settings.removeIndexPattern();
    });

    const columns = [
      {
        heading: 'Name',
        first: '@message',
        last: 'xss.raw',
        selector: async function () {
          const tableRow = await PageObjects.settings.getTableRow(0, 0);
          return await tableRow.getVisibleText();
        },
      },
      {
        heading: 'Type',
        first: '_source',
        last: 'string',
        selector: async function () {
          const tableRow = await PageObjects.settings.getTableRow(0, 1);
          return await tableRow.getVisibleText();
        },
      },
    ];

    columns.forEach(function (col) {
      describe('sort by heading - ' + col.heading, function indexPatternCreation() {
        it('should sort ascending', async function () {
          await PageObjects.settings.sortBy(col.heading);
          const rowText = await col.selector();
          expect(rowText).to.be(col.first);
        });

        it('should sort descending', async function () {
          await PageObjects.settings.sortBy(col.heading);
          const getText = await col.selector();
          expect(getText).to.be(col.last);
        });
      });
    });

    describe('field list pagination', function () {
      const EXPECTED_FIELD_COUNT = 86;
      it('makelogs data should have expected number of fields', async function () {
        await retry.try(async function () {
          const TabCount = await PageObjects.settings.getFieldsTabCount();
          expect(TabCount).to.be('' + EXPECTED_FIELD_COUNT);
        });
      });
    }); // end describe pagination
  }); // end index result field sort
}
