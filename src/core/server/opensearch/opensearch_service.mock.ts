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

import { BehaviorSubject } from 'rxjs';
import type { PublicMethodsOf } from '@osd/utility-types';

import { ILegacyClusterClient, ILegacyCustomClusterClient } from './legacy';
import { opensearchClientMock, ClusterClientMock, CustomClusterClientMock } from './client/mocks';
import { OpenSearchClientConfig } from './client';
import { legacyClientMock } from './legacy/mocks';
import { OpenSearchConfig } from './opensearch_config';
import { OpenSearchService } from './opensearch_service';
import { InternalOpenSearchServiceSetup, OpenSearchStatusMeta } from './types';
import { NodesVersionCompatibility } from './version_check/ensure_opensearch_version';
import { ServiceStatus, ServiceStatusLevels } from '../status';

export interface MockedOpenSearchServiceSetup {
  legacy: {
    config$: BehaviorSubject<OpenSearchConfig>;
    createClient: jest.Mock<ILegacyCustomClusterClient, any>;
    client: jest.Mocked<ILegacyClusterClient>;
  };
}

type MockedOpenSearchServiceStart = MockedOpenSearchServiceSetup & {
  client: ClusterClientMock;
  createClient: jest.MockedFunction<
    (name: string, config?: Partial<OpenSearchClientConfig>) => CustomClusterClientMock
  >;
};

const createSetupContractMock = () => {
  const setupContract: MockedOpenSearchServiceSetup = {
    legacy: {
      config$: new BehaviorSubject({} as OpenSearchConfig),
      createClient: jest.fn(),
      client: legacyClientMock.createClusterClient(),
    },
  };
  setupContract.legacy.createClient.mockReturnValue(legacyClientMock.createCustomClusterClient());
  setupContract.legacy.client.asScoped.mockReturnValue(
    legacyClientMock.createScopedClusterClient()
  );
  return setupContract;
};

const createStartContractMock = () => {
  const startContract: MockedOpenSearchServiceStart = {
    client: opensearchClientMock.createClusterClient(),
    createClient: jest.fn(),
    legacy: {
      config$: new BehaviorSubject({} as OpenSearchConfig),
      createClient: jest.fn(),
      client: legacyClientMock.createClusterClient(),
    },
  };
  startContract.legacy.createClient.mockReturnValue(legacyClientMock.createCustomClusterClient());
  startContract.legacy.client.asScoped.mockReturnValue(
    legacyClientMock.createScopedClusterClient()
  );
  startContract.createClient.mockImplementation(() =>
    opensearchClientMock.createCustomClusterClient()
  );
  return startContract;
};

const createInternalStartContractMock = createStartContractMock;

type MockedInternalOpenSearchServiceSetup = jest.Mocked<
  InternalOpenSearchServiceSetup & {
    legacy: { client: jest.Mocked<ILegacyClusterClient> };
  }
>;
const createInternalSetupContractMock = () => {
  const setupContract: MockedInternalOpenSearchServiceSetup = {
    opensearchNodesCompatibility$: new BehaviorSubject<NodesVersionCompatibility>({
      isCompatible: true,
      incompatibleNodes: [],
      warningNodes: [],
      opensearchDashboardsVersion: '8.0.0',
    }),
    status$: new BehaviorSubject<ServiceStatus<OpenSearchStatusMeta>>({
      level: ServiceStatusLevels.available,
      summary: 'OpenSearch is available',
    }),
    legacy: {
      ...createSetupContractMock().legacy,
    },
  };
  setupContract.legacy.client.asScoped.mockReturnValue(
    legacyClientMock.createScopedClusterClient()
  );
  return setupContract;
};

type OpenSearchServiceContract = PublicMethodsOf<OpenSearchService>;
const createMock = () => {
  const mocked: jest.Mocked<OpenSearchServiceContract> = {
    setup: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };
  mocked.setup.mockResolvedValue(createInternalSetupContractMock());
  mocked.start.mockResolvedValueOnce(createInternalStartContractMock());
  mocked.stop.mockResolvedValue();
  return mocked;
};

export const opensearchServiceMock = {
  create: createMock,
  createInternalSetup: createInternalSetupContractMock,
  createSetup: createSetupContractMock,
  createInternalStart: createInternalStartContractMock,
  createStart: createStartContractMock,
  createLegacyClusterClient: legacyClientMock.createClusterClient,
  createLegacyCustomClusterClient: legacyClientMock.createCustomClusterClient,
  createLegacyScopedClusterClient: legacyClientMock.createScopedClusterClient,
  createLegacyOpenSearchClient: legacyClientMock.createOpenSearchClient,

  ...opensearchClientMock,
};
