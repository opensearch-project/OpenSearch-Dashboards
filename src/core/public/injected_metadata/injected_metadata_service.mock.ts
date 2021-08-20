/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
import type { PublicMethodsOf } from '@osd/utility-types';
import { InjectedMetadataService, InjectedMetadataSetup } from './injected_metadata_service';

const createSetupContractMock = () => {
  const setupContract: jest.Mocked<InjectedMetadataSetup> = {
    getBasePath: jest.fn(),
    getServerBasePath: jest.fn(),
    getOpenSearchDashboardsVersion: jest.fn(),
    getOpenSearchDashboardsBranch: jest.fn(),
    getCspConfig: jest.fn(),
    getAnonymousStatusPage: jest.fn(),
    getLegacyMetadata: jest.fn(),
    getPlugins: jest.fn(),
    getInjectedVar: jest.fn(),
    getInjectedVars: jest.fn(),
    getOpenSearchDashboardsBuildNumber: jest.fn(),
    getBranding: jest.fn(),
  };
  setupContract.getCspConfig.mockReturnValue({ warnLegacyBrowsers: true });
  setupContract.getOpenSearchDashboardsVersion.mockReturnValue('opensearchDashboardsVersion');
  setupContract.getAnonymousStatusPage.mockReturnValue(false);
  setupContract.getLegacyMetadata.mockReturnValue({
    app: {
      id: 'foo',
      title: 'Foo App',
    },
    nav: [],
    uiSettings: {
      defaults: { legacyInjectedUiSettingDefaults: true },
      user: { legacyInjectedUiSettingUserValues: true },
    },
  } as any);
  setupContract.getPlugins.mockReturnValue([]);
  return setupContract;
};

const createStartContractMock = createSetupContractMock;

type InjectedMetadataServiceContract = PublicMethodsOf<InjectedMetadataService>;
const createMock = (): jest.Mocked<InjectedMetadataServiceContract> => ({
  setup: jest.fn().mockReturnValue(createSetupContractMock()),
  start: jest.fn().mockReturnValue(createStartContractMock()),
});

export const injectedMetadataServiceMock = {
  create: createMock,
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
};
