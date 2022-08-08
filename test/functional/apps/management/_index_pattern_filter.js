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
  const PageObjects = getPageObjects(['settings']);

  describe('index pattern filter', function describeIndexTests() {
    before(async function () {
      // delete .kibana index and then wait for OpenSearch Dashboards to re-create it
      await opensearchDashboardsServer.uiSettings.replace({});
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickOpenSearchDashboardsIndexPatterns();
    });

    beforeEach(async function () {
      await PageObjects.settings.createIndexPattern();
    });

    afterEach(async function () {
      await PageObjects.settings.removeIndexPattern();
    });

    it('should filter indexed fields', async function () {
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickOpenSearchDashboardsIndexPatterns();
      await PageObjects.settings.clickIndexPatternLogstash();
      await PageObjects.settings.getFieldTypes();
      await PageObjects.settings.setFieldTypeFilter('string');

      await retry.try(async function () {
        const fieldTypes = await PageObjects.settings.getFieldTypes();
        expect(fieldTypes.length).to.be.above(0);
        for (const fieldType of fieldTypes) {
          expect(fieldType).to.be('string');
        }
      });

      await PageObjects.settings.setFieldTypeFilter('number');

      await retry.try(async function () {
        const fieldTypes = await PageObjects.settings.getFieldTypes();
        expect(fieldTypes.length).to.be.above(0);
        for (const fieldType of fieldTypes) {
          expect(fieldType).to.be('number');
        }
      });
    });
  });
}
