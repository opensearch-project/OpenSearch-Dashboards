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
  const log = getService('log');
  const browser = getService('browser');
  const opensearchArchiver = getService('opensearchArchiver');
  const PageObjects = getPageObjects(['settings']);

  // this functionality is no longer functional as of 7.0 but still needs cleanup
  // https://github.com/elastic/kibana/issues/74118
  describe.skip('filter scripted fields', function describeIndexTests() {
    before(async function () {
      // delete .kibana index and then wait for OpenSearch Dashboards to re-create it
      await browser.setWindowSize(1200, 800);
      await opensearchArchiver.load('management');
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: 'f1e4c910-a2e6-11e7-bb30-233be9be6a15',
      });
    });

    after(async function () {
      await opensearchArchiver.unload('management');
      await opensearchDashboardsServer.uiSettings.replace({});
    });

    const scriptedPainlessFieldName = 'ram_pain1';

    it('should filter scripted fields', async function () {
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickOpenSearchDashboardsIndexPatterns();
      await PageObjects.settings.clickIndexPatternLogstash();
      await PageObjects.settings.clickScriptedFieldsTab();
      const scriptedFieldLangsBefore = await PageObjects.settings.getScriptedFieldLangs();
      await log.debug('add scripted field');

      // The expression scripted field has been pre-created in the management opensearchArchiver pack since it is no longer
      // possible to create an expression script via the UI
      await PageObjects.settings.addScriptedField(
        scriptedPainlessFieldName,
        'painless',
        'number',
        null,
        '1',
        "doc['machine.ram'].value / (1024 * 1024 * 1024)"
      );

      // confirm two additional scripted fields were created
      await retry.try(async function () {
        const scriptedFieldLangs = await PageObjects.settings.getScriptedFieldLangs();
        expect(scriptedFieldLangs.length).to.be(scriptedFieldLangsBefore.length + 1);
      });

      await PageObjects.settings.setScriptedFieldLanguageFilter('painless');

      await retry.try(async function () {
        const scriptedFieldLangs = await PageObjects.settings.getScriptedFieldLangs();
        expect(scriptedFieldLangs.length).to.be.above(0);
        for (const lang of scriptedFieldLangs) {
          expect(lang).to.be('painless');
        }
      });

      await PageObjects.settings.setScriptedFieldLanguageFilter('expression');

      await retry.try(async function () {
        const scriptedFieldLangs = await PageObjects.settings.getScriptedFieldLangs();
        expect(scriptedFieldLangs.length).to.be.above(0);
        for (const lang of scriptedFieldLangs) {
          expect(lang).to.be('expression');
        }
      });
    });
  });
}
