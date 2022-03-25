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

import { FtrProviderContext } from '../../../functional/ftr_provider_context';

export default function ({ getService, getPageObjects, loadTestFile }: FtrProviderContext) {
  const browser = getService('browser');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const appsMenu = getService('appsMenu');
  const testSubjects = getService('testSubjects');
  const PageObjects = getPageObjects(['common', 'header']);

  describe('runPipeline', function () {
    this.tags(['skipFirefox']);

    before(async () => {
      await opensearchArchiver.loadIfNeeded(
        '../functional/fixtures/opensearch_archiver/logstash_functional'
      );
      await opensearchArchiver.load(
        '../functional/fixtures/opensearch_archiver/visualize_embedding'
      );
      await opensearchDashboardsServer.uiSettings.replace({
        'dateFormat:tz': 'Australia/North',
        defaultIndex: 'logstash-*',
      });
      await browser.setWindowSize(1300, 900);
      await PageObjects.common.navigateToApp('settings');
      await appsMenu.clickLink('Run Pipeline');
      await testSubjects.find('pluginContent');
    });

    loadTestFile(require.resolve('./basic'));
    loadTestFile(require.resolve('./tag_cloud'));
    loadTestFile(require.resolve('./metric'));
    loadTestFile(require.resolve('./opensearchaggs'));
  });
}
