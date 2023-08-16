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

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const security = getService('security');
  const PageObjects = getPageObjects(['common', 'timePicker', 'discover']);

  describe('indexpattern without timefield', () => {
    before(async () => {
      await security.testUser.setRoles([
        'opensearch_dashboards_admin',
        'opensearch_dashboards_timefield',
      ]);
      await opensearchArchiver.loadIfNeeded('index_pattern_without_timefield');
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: 'without-timefield',
        'discover:v2': false,
      });
      await PageObjects.common.navigateToApp('discover');
    });

    after(async () => {
      await security.testUser.restoreDefaults();
      await opensearchArchiver.unload('index_pattern_without_timefield');
    });

    it('should not display a timepicker', async () => {
      if (await PageObjects.timePicker.timePickerExists()) {
        throw new Error('Expected timepicker not to exist');
      }
    });

    it('should display a timepicker after switching to an index pattern with timefield', async () => {
      await PageObjects.discover.selectIndexPattern('with-timefield');
      if (!(await PageObjects.timePicker.timePickerExists())) {
        throw new Error('Expected timepicker to exist');
      }
    });
  });
}
