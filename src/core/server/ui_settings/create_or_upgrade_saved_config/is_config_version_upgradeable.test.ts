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

import { isConfigVersionUpgradeable } from './is_config_version_upgradeable';

describe('savedObjects/health_check/isConfigVersionUpgradeable', function () {
  function isUpgradeableTest(
    savedVersion: string,
    opensearchDashboardsVersion: string,
    expected: boolean
  ) {
    it(`should return ${expected} for config version ${savedVersion} and OpenSearch Dashboards version ${opensearchDashboardsVersion}`, () => {
      expect(isConfigVersionUpgradeable(savedVersion, opensearchDashboardsVersion)).toBe(expected);
    });
  }

  isUpgradeableTest('1.0.0-beta1', '7.4.0', false);
  isUpgradeableTest('1.0.0-beta256', '7.4.0', false);
  isUpgradeableTest('10.100.1000-beta256', '10.100.1000-beta257', false);
  isUpgradeableTest('7.4.0', '7.4.0', false);
  isUpgradeableTest('4.0.0-RC1', '4.0.0-RC2', true);
  isUpgradeableTest('10.100.1000-rc256', '10.100.1000-RC257', true);
  isUpgradeableTest('4.0.0-rc2', '4.0.0-rc1', false);
  isUpgradeableTest('4.0.0-rc2', '4.0.0', true);
  isUpgradeableTest('4.0.0-rc2', '4.0.2', true);
  isUpgradeableTest('4.0.1', '4.1.0-rc', true);
  isUpgradeableTest('4.0.0-rc1', '4.0.0', true);
  isUpgradeableTest('50.0.9-rc150', '50.0.9', true);
  isUpgradeableTest('50.0.9', '50.0.9-rc150', false);
  isUpgradeableTest('50.0.9', '50.0.10-rc150', true);
  isUpgradeableTest('4.0.0-rc1-SNAPSHOT', '4.0.0', false);
  isUpgradeableTest('4.1.0-rc1-SNAPSHOT', '4.1.0-rc1', false);
  isUpgradeableTest('5.0.0-alpha11', '5.0.0', false);
  isUpgradeableTest('50.0.10-rc150-SNAPSHOT', '50.0.9', false);
  isUpgradeableTest(undefined as any, '7.4.0', false);
  isUpgradeableTest('@@version', '7.4.0', false);
  isUpgradeableTest('6.8.0', '1.0.0', true);
  isUpgradeableTest('7.0.0', '1.0.0', true);
  isUpgradeableTest('7.10.2', '1.0.0', true);
  isUpgradeableTest('6.8.0-rc1', '1.0.0', true);
  isUpgradeableTest('7.0.0-rc1', '1.0.0', true);
  isUpgradeableTest('7.10.2-rc1', '1.0.0', true);
  isUpgradeableTest('6.8.0', '1.0.0-rc1', true);
  isUpgradeableTest('7.0.0', '1.0.0-rc1', true);
  isUpgradeableTest('7.10.2', '1.0.0-rc1', true);
  isUpgradeableTest('6.7.10', '1.0.0', false);
  isUpgradeableTest('7.10.3', '1.0.0', false);
  isUpgradeableTest('6.7.10-rc1', '1.0.0', false);
  isUpgradeableTest('7.10.3-rc1', '1.0.0', false);
  isUpgradeableTest('6.7.10', '1.0.0-rc1', false);
  isUpgradeableTest('7.10.3', '1.0.0-rc1', false);
  isUpgradeableTest('6.8.0', '1.0.1', true);
  isUpgradeableTest('7.0.0', '1.0.1', true);
  isUpgradeableTest('7.10.2', '1.0.1', true);
  isUpgradeableTest('6.8.0-rc1', '1.0.1', true);
  isUpgradeableTest('7.0.0-rc1', '1.0.1', true);
  isUpgradeableTest('7.10.2-rc1', '1.0.1', true);
  isUpgradeableTest('6.8.0', '1.0.1-rc1', true);
  isUpgradeableTest('7.0.0', '1.0.1-rc1', true);
  isUpgradeableTest('7.10.2', '1.0.1-rc1', true);
  isUpgradeableTest('1.0.0-rc1', '1.0.0', true);
  isUpgradeableTest('1.0.1', '1.0.0', false);
  isUpgradeableTest('7.10.2', '1.1.0', true);
  isUpgradeableTest('7.10.2', '2.0.0', true);
  isUpgradeableTest('7.10.2', '3.0.0', false);
});
