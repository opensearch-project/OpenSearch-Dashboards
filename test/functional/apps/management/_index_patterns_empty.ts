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

import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getPageObjects, getService }: FtrProviderContext) {
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const log = getService('log');
  const PageObjects = getPageObjects(['common', 'settings']);
  const testSubjects = getService('testSubjects');
  const globalNav = getService('globalNav');
  const opensearch = getService('legacyOpenSearch');

  describe('index pattern empty view', () => {
    before(async () => {
      await opensearchArchiver.load('empty_opensearch_dashboards');
      await opensearchArchiver.unload('logstash_functional');
      await opensearchArchiver.unload('makelogs');
      await opensearchDashboardsServer.uiSettings.replace({});
      await PageObjects.settings.navigateTo();
    });

    after(async () => {
      await opensearchArchiver.unload('empty_opensearch_dashboards');
      await opensearchArchiver.loadIfNeeded('makelogs');
      // @ts-expect-error
      await opensearch.transport.request({
        path: '/logstash-a',
        method: 'DELETE',
      });
    });

    // create index pattern and return to verify list
    it(`shows empty views`, async () => {
      await PageObjects.settings.clickOpenSearchDashboardsIndexPatterns();
      log.debug(
        `\n\nNOTE: If this test fails make sure there aren't any non-system indices in the _cat/indices output (use opensearchArchiver.unload on them)`
      );
      log.debug(
        // @ts-expect-error
        await opensearch.transport.request({
          path: '/_cat/indices',
          method: 'GET',
        })
      );
      await testSubjects.existOrFail('createAnyway');
      // @ts-expect-error
      await opensearch.transport.request({
        path: '/logstash-a/_doc',
        method: 'POST',
        body: { user: 'matt', message: 20 },
      });
      await testSubjects.click('refreshIndicesButton');
      await testSubjects.existOrFail('createIndexPatternButton', { timeout: 5000 });
      await PageObjects.settings.createIndexPattern('logstash-*', '');
    });

    it(`doesn't show read-only badge`, async () => {
      await globalNav.badgeMissingOrFail();
    });
  });
}
