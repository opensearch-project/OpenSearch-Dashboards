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

import path from 'path';

const OPENSEARCH_DASHBOARDS_ARCHIVE_PATH = path.resolve(
  __dirname,
  '../../../functional/fixtures/opensearch_archiver/dashboard/current/opensearch_dashboards'
);

const DATA_ARCHIVE_PATH = path.resolve(
  __dirname,
  '../../../functional/fixtures/opensearch_archiver/dashboard/current/data'
);

export default function ({ getService, getPageObjects, loadTestFile }) {
  const browser = getService('browser');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const PageObjects = getPageObjects(['common', 'dashboard']);

  describe('pluggable panel actions', function () {
    before(async () => {
      await browser.setWindowSize(1300, 900);
      await opensearchArchiver.load(OPENSEARCH_DASHBOARDS_ARCHIVE_PATH);
      await opensearchArchiver.loadIfNeeded(DATA_ARCHIVE_PATH);
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: 'logstash-*',
      });
      await PageObjects.common.navigateToApp('dashboard');
      await PageObjects.dashboard.preserveCrossAppState();
    });

    after(async function () {
      await PageObjects.dashboard.clearSavedObjectsFromAppLinks();
      await opensearchArchiver.unload(OPENSEARCH_DASHBOARDS_ARCHIVE_PATH);
      await opensearchArchiver.unload(DATA_ARCHIVE_PATH);
    });

    loadTestFile(require.resolve('./panel_actions'));
  });
}
