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

import { SavedObjectsClientContract, IUiSettingsClient } from 'src/core/server';

import {
  createTestServers,
  TestOpenSearchUtils,
  TestOpenSearchDashboardsUtils,
  TestUtils,
} from '../../../../test_helpers/osd_server';
import { LegacyAPICaller } from '../../../opensearch/';
import { httpServerMock } from '../../../http/http_server.mocks';

let servers: TestUtils;
let opensearchServer: TestOpenSearchUtils;
let osd: TestOpenSearchDashboardsUtils;

let osdServer: TestOpenSearchDashboardsUtils['osdServer'];

interface AllServices {
  osdServer: TestOpenSearchDashboardsUtils['osdServer'];
  savedObjectsClient: SavedObjectsClientContract;
  callCluster: LegacyAPICaller;
  uiSettings: IUiSettingsClient;
}

let services: AllServices;

export async function startServers() {
  servers = createTestServers({
    adjustTimeout: (t) => jest.setTimeout(t),
    settings: {
      osd: {
        uiSettings: {
          overrides: {
            foo: 'bar',
          },
        },
      },
    },
  });
  opensearchServer = await servers.startOpenSearch();
  osd = await servers.startOpenSearchDashboards();
  osdServer = osd.osdServer;
}

export function getServices() {
  if (services) {
    return services;
  }

  const callCluster = opensearchServer.opensearch.getCallCluster();

  const savedObjectsClient = osd.coreStart.savedObjects.getScopedClient(
    httpServerMock.createOpenSearchDashboardsRequest()
  );

  const uiSettings = osdServer.newPlatform.start.core.uiSettings.asScopedToClient(
    savedObjectsClient
  );

  services = {
    osdServer,
    callCluster,
    savedObjectsClient,
    uiSettings,
  };

  return services;
}

export async function stopServers() {
  services = null!;
  osdServer = null!;
  if (servers) {
    await opensearchServer.stop();
    await osd.stop();
  }
}
