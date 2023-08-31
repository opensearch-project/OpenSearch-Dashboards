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
  const log = getService('log');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const PageObjects = getPageObjects(['common', 'timePicker', 'discover']);

  describe('source filters', function describeIndexTests() {
    before(async function () {
      log.debug('load opensearch-dashboards index with default index pattern');
      await opensearchArchiver.load('visualize_source-filters');

      // and load a set of makelogs data
      await opensearchArchiver.loadIfNeeded('logstash_functional');

      // delete .kibana index and update configDoc
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: 'logstash-*',
        'discover:v2': false,
      });

      log.debug('discover');
      await PageObjects.common.navigateToApp('discover');

      await PageObjects.timePicker.setDefaultAbsoluteRange();

      //After hiding the time picker, we need to wait for
      //the refresh button to hide before clicking the share button
      await PageObjects.common.sleep(1000);
    });

    it('should not get the field referer', async function () {
      const fieldNames = await PageObjects.discover.getAllFieldNames();
      expect(fieldNames).to.not.contain('referer');
      const relatedContentFields = fieldNames.filter(
        (fieldName) => fieldName.indexOf('relatedContent') === 0
      );
      expect(relatedContentFields).to.have.length(0);
    });
  });
}
