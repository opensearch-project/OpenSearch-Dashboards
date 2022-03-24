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

/* Steps for version conflict test
 1. Create index pattern
 2. Click on  scripted field and fill in the values
 3. Use opensearch to update the index pattern's title
 4. Try to save the scripted field
 5. OpenSearch Dashboards should display the message - you need to refresh the index pattern

 */

import expect from '@osd/expect';

export default function ({ getService, getPageObjects }) {
  const opensearchArchiver = getService('opensearchArchiver');
  const browser = getService('browser');
  const opensearch = getService('legacyOpenSearch');
  const retry = getService('retry');
  const scriptedFiledName = 'versionConflictScript';
  const PageObjects = getPageObjects(['common', 'home', 'settings', 'discover', 'header']);
  const log = getService('log');

  describe('index version conflict', function describeIndexTests() {
    before(async function () {
      await browser.setWindowSize(1200, 800);
      await opensearchArchiver.load('discover');
    });

    it('Should be able to surface version conflict notification while creating scripted field', async function () {
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickOpenSearchDashboardsIndexPatterns();
      await PageObjects.settings.clickIndexPatternLogstash();
      await PageObjects.settings.clickScriptedFieldsTab();
      await PageObjects.settings.clickAddScriptedField();
      await PageObjects.settings.setScriptedFieldName(scriptedFiledName);
      await PageObjects.settings.setScriptedFieldScript(`doc['bytes'].value`);
      const response = await opensearch.update({
        index: '.kibana',
        // TODO: verify no BWC issues here
        // Removed: https://github.com/opensearch-project/OpenSearch/pull/2239
        // type: '_doc',
        id: 'index-pattern:logstash-*',
        body: {
          doc: { 'index-pattern': { fieldFormatMap: '{"geo.src":{"id":"number"}}' } },
        },
      });
      log.debug(JSON.stringify(response));
      expect(response.result).to.be('updated');
      await PageObjects.settings.setFieldFormat('url');
      await PageObjects.settings.clickSaveScriptedField();
      await retry.try(async function () {
        const message = await PageObjects.common.closeToast();
        expect(message).to.contain('Unable');
      });
    });

    it('Should be able to surface version conflict notification while changing field format', async function () {
      const fieldName = 'geo.srcdest';
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickOpenSearchDashboardsIndexPatterns();
      await PageObjects.settings.clickIndexPatternLogstash();
      log.debug('Starting openControlsByName (' + fieldName + ')');
      await PageObjects.settings.openControlsByName(fieldName);
      log.debug('controls are open');
      await PageObjects.settings.setFieldFormat('url');
      const response = await opensearch.update({
        index: '.kibana',
        // TODO: verify no BWC issues here
        // Removed: https://github.com/opensearch-project/OpenSearch/pull/2239
        // type: '_doc',
        id: 'index-pattern:logstash-*',
        body: {
          doc: { 'index-pattern': { fieldFormatMap: '{"geo.dest":{"id":"number"}}' } },
        },
      });
      log.debug(JSON.stringify(response));
      expect(response.result).to.be('updated');
      await PageObjects.settings.controlChangeSave();
      await retry.try(async function () {
        //await PageObjects.common.sleep(2000);
        const message = await PageObjects.common.closeToast();
        expect(message).to.contain('Unable');
      });
    });
  });
}
