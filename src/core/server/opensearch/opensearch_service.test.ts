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

import { MockLegacyClusterClient, MockClusterClient } from './opensearch_service.test.mocks';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { REPO_ROOT } from '@osd/dev-utils';
import { Env } from '../config';
import { configServiceMock, getEnvOptions } from '../config/mocks';
import { CoreContext } from '../core_context';
import { loggingSystemMock } from '../logging/logging_system.mock';
import { httpServiceMock } from '../http/http_service.mock';
import { auditTrailServiceMock } from '../audit_trail/audit_trail_service.mock';
import { OpenSearchConfig } from './opensearch_config';
import { OpenSearchService } from './opensearch_service';
import { opensearchServiceMock } from './opensearch_service.mock';
import { opensearchClientMock } from './client/mocks';
import { duration } from 'moment';

const delay = async (durationMs: number) =>
  await new Promise((resolve) => setTimeout(resolve, durationMs));

let opensearchService: OpenSearchService;
const configService = configServiceMock.create();
const setupDeps = {
  http: httpServiceMock.createInternalSetupContract(),
};
const startDeps = {
  auditTrail: auditTrailServiceMock.createStartContract(),
};
configService.atPath.mockReturnValue(
  new BehaviorSubject({
    hosts: ['http://1.2.3.4'],
    healthCheck: {
      delay: duration(10),
    },
    ssl: {
      verificationMode: 'none',
    },
  } as any)
);

let env: Env;
let coreContext: CoreContext;
const logger = loggingSystemMock.create();

let mockClusterClientInstance: ReturnType<typeof opensearchClientMock.createCustomClusterClient>;
let mockLegacyClusterClientInstance: ReturnType<typeof opensearchServiceMock.createLegacyCustomClusterClient>;

beforeEach(() => {
  env = Env.createDefault(REPO_ROOT, getEnvOptions());

  coreContext = { coreId: Symbol(), env, logger, configService: configService as any };
  opensearchService = new OpenSearchService(coreContext);

  MockLegacyClusterClient.mockClear();
  MockClusterClient.mockClear();

  mockLegacyClusterClientInstance = opensearchServiceMock.createLegacyCustomClusterClient();
  MockLegacyClusterClient.mockImplementation(() => mockLegacyClusterClientInstance);
  mockClusterClientInstance = opensearchClientMock.createCustomClusterClient();
  MockClusterClient.mockImplementation(() => mockClusterClientInstance);
});

afterEach(() => jest.clearAllMocks());

describe('#setup', () => {
  it('returns legacy OpenSearch config as a part of the contract', async () => {
    const setupContract = await opensearchService.setup(setupDeps);

    await expect(setupContract.legacy.config$.pipe(first()).toPromise()).resolves.toBeInstanceOf(
      OpenSearchConfig
    );
  });

  it('returns legacy opensearch client as a part of the contract', async () => {
    const setupContract = await opensearchService.setup(setupDeps);
    const client = setupContract.legacy.client;

    expect(mockLegacyClusterClientInstance.callAsInternalUser).toHaveBeenCalledTimes(0);
    await client.callAsInternalUser('any');
    expect(mockLegacyClusterClientInstance.callAsInternalUser).toHaveBeenCalledTimes(1);
  });

  describe('#createLegacyClient', () => {
    it('allows to specify config properties', async () => {
      const setupContract = await opensearchService.setup(setupDeps);

      // reset all mocks called during setup phase
      MockLegacyClusterClient.mockClear();

      const customConfig = { logQueries: true };
      const clusterClient = setupContract.legacy.createClient('some-custom-type', customConfig);

      expect(clusterClient).toBe(mockLegacyClusterClientInstance);

      expect(MockLegacyClusterClient).toHaveBeenCalledWith(
        expect.objectContaining(customConfig),
        expect.objectContaining({ context: ['opensearch', 'some-custom-type'] }),
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('falls back to opensearch default config values if property not specified', async () => {
      const setupContract = await opensearchService.setup(setupDeps);

      // reset all mocks called during setup phase
      MockLegacyClusterClient.mockClear();

      const customConfig = {
        hosts: ['http://8.8.8.8'],
        logQueries: true,
        ssl: { certificate: 'certificate-value' },
      };
      setupContract.legacy.createClient('some-custom-type', customConfig);

      const config = MockLegacyClusterClient.mock.calls[0][0];
      expect(config).toMatchInlineSnapshot(`
        Object {
          "healthCheckDelay": "PT0.01S",
          "hosts": Array [
            "http://8.8.8.8",
          ],
          "logQueries": true,
          "requestHeadersWhitelist": Array [
            undefined,
          ],
          "ssl": Object {
            "certificate": "certificate-value",
            "verificationMode": "none",
          },
        }
      `);
    });
    it('falls back to opensearch config if custom config not passed', async () => {
      const setupContract = await opensearchService.setup(setupDeps);

      // reset all mocks called during setup phase
      MockLegacyClusterClient.mockClear();

      setupContract.legacy.createClient('another-type');

      const config = MockLegacyClusterClient.mock.calls[0][0];
      expect(config).toMatchInlineSnapshot(`
        Object {
          "healthCheckDelay": "PT0.01S",
          "hosts": Array [
            "http://1.2.3.4",
          ],
          "requestHeadersWhitelist": Array [
            undefined,
          ],
          "ssl": Object {
            "alwaysPresentCertificate": undefined,
            "certificate": undefined,
            "certificateAuthorities": undefined,
            "key": undefined,
            "keyPassphrase": undefined,
            "verificationMode": "none",
          },
        }
      `);
    });

    it('does not merge opensearch hosts if custom config overrides', async () => {
      configService.atPath.mockReturnValueOnce(
        new BehaviorSubject({
          hosts: ['http://1.2.3.4', 'http://9.8.7.6'],
          healthCheck: {
            delay: duration(2000),
          },
          ssl: {
            verificationMode: 'none',
          },
        } as any)
      );
      opensearchService = new OpenSearchService(coreContext);
      const setupContract = await opensearchService.setup(setupDeps);

      // reset all mocks called during setup phase
      MockLegacyClusterClient.mockClear();

      const customConfig = {
        hosts: ['http://8.8.8.8'],
        logQueries: true,
        ssl: { certificate: 'certificate-value' },
      };
      setupContract.legacy.createClient('some-custom-type', customConfig);

      const config = MockLegacyClusterClient.mock.calls[0][0];
      expect(config).toMatchInlineSnapshot(`
        Object {
          "healthCheckDelay": "PT2S",
          "hosts": Array [
            "http://8.8.8.8",
          ],
          "logQueries": true,
          "requestHeadersWhitelist": Array [
            undefined,
          ],
          "ssl": Object {
            "certificate": "certificate-value",
            "verificationMode": "none",
          },
        }
      `);
    });
  });

  it('opensearchNodeVersionCompatibility$ only starts polling when subscribed to', (done) => {
    const mockedClient = mockClusterClientInstance.asInternalUser;
    mockedClient.nodes.info.mockImplementation(() =>
      opensearchClientMock.createErrorTransportRequestPromise(new Error())
    );
    opensearchService.setup(setupDeps).then((setupContract) => {
      delay(10).then(() => {
        expect(mockedClient.nodes.info).toHaveBeenCalledTimes(0);
        setupContract.opensearchNodesCompatibility$.subscribe(() => {
          expect(mockedClient.nodes.info).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });
  });

  it('opensearchNodeVersionCompatibility$ stops polling when unsubscribed from', async () => {
    const mockedClient = mockClusterClientInstance.asInternalUser;
    mockedClient.nodes.info.mockImplementation(() =>
      opensearchClientMock.createErrorTransportRequestPromise(new Error())
    );

    const setupContract = await opensearchService.setup(setupDeps);

    expect(mockedClient.nodes.info).toHaveBeenCalledTimes(0);
    const sub = setupContract.opensearchNodesCompatibility$.subscribe(async () => {
      sub.unsubscribe();
      await delay(100);
      expect(mockedClient.nodes.info).toHaveBeenCalledTimes(1);
    });
  });

  it('opensearchNodeVersionCompatibility$ avoid polling when opensearch hosts is empty', async () => {
    const mockedClient = mockClusterClientInstance.asInternalUser;
    configService.atPath.mockReturnValueOnce(
      new BehaviorSubject({
        hosts: [],
        healthCheck: {
          delay: duration(2000),
        },
        ssl: {
          verificationMode: 'none',
        },
      } as any)
    );
    opensearchService = new OpenSearchService(coreContext);
    const setupContract = await opensearchService.setup(setupDeps);

    // reset all mocks called during setup phase
    MockLegacyClusterClient.mockClear();

    setupContract.opensearchNodesCompatibility$.subscribe(async () => {
      expect(mockedClient.nodes.info).toHaveBeenCalledTimes(0);
    });
  });
});

describe('#start', () => {
  it('throws if called before `setup`', async () => {
    expect(() => opensearchService.start(startDeps)).rejects.toMatchInlineSnapshot(
      `[Error: OpenSearchService needs to be setup before calling start]`
    );
  });

  it('returns opensearch client as a part of the contract', async () => {
    await opensearchService.setup(setupDeps);
    const startContract = await opensearchService.start(startDeps);
    const client = startContract.client;

    expect(client.asInternalUser).toBe(mockClusterClientInstance.asInternalUser);
  });

  describe('#createClient', () => {
    it('allows to specify config properties', async () => {
      await opensearchService.setup(setupDeps);
      const startContract = await opensearchService.start(startDeps);

      // reset all mocks called during setup phase
      MockClusterClient.mockClear();

      const customConfig = { logQueries: true };
      const clusterClient = startContract.createClient('custom-type', customConfig);

      expect(clusterClient).toBe(mockClusterClientInstance);

      expect(MockClusterClient).toHaveBeenCalledTimes(1);
      expect(MockClusterClient).toHaveBeenCalledWith(
        expect.objectContaining(customConfig),
        expect.objectContaining({ context: ['opensearch', 'custom-type'] }),
        expect.any(Function)
      );
    });
    it('creates a new client on each call', async () => {
      await opensearchService.setup(setupDeps);
      const startContract = await opensearchService.start(startDeps);

      // reset all mocks called during setup phase
      MockClusterClient.mockClear();

      const customConfig = { logQueries: true };

      startContract.createClient('custom-type', customConfig);
      startContract.createClient('another-type', customConfig);

      expect(MockClusterClient).toHaveBeenCalledTimes(2);
    });

    it('falls back to opensearch default config values if property not specified', async () => {
      await opensearchService.setup(setupDeps);
      const startContract = await opensearchService.start(startDeps);

      // reset all mocks called during setup phase
      MockClusterClient.mockClear();

      const customConfig = {
        hosts: ['http://8.8.8.8'],
        logQueries: true,
        ssl: { certificate: 'certificate-value' },
      };

      startContract.createClient('some-custom-type', customConfig);
      const config = MockClusterClient.mock.calls[0][0];

      expect(config).toMatchInlineSnapshot(`
        Object {
          "healthCheckDelay": "PT0.01S",
          "hosts": Array [
            "http://8.8.8.8",
          ],
          "logQueries": true,
          "requestHeadersWhitelist": Array [
            undefined,
          ],
          "ssl": Object {
            "certificate": "certificate-value",
            "verificationMode": "none",
          },
        }
      `);
    });
  });
});

describe('#stop', () => {
  it('stops both legacy and new clients', async () => {
    await opensearchService.setup(setupDeps);
    await opensearchService.start(startDeps);
    await opensearchService.stop();

    expect(mockLegacyClusterClientInstance.close).toHaveBeenCalledTimes(1);
    expect(mockClusterClientInstance.close).toHaveBeenCalledTimes(1);
  });

  it('stops pollOpenSearchNodeVersions even if there are active subscriptions', (done) => {
    expect.assertions(3);

    const mockedClient = mockClusterClientInstance.asInternalUser;
    mockedClient.nodes.info.mockImplementation(() =>
      opensearchClientMock.createErrorTransportRequestPromise(new Error())
    );

    opensearchService.setup(setupDeps).then((setupContract) => {
      setupContract.opensearchNodesCompatibility$.subscribe(async () => {
        expect(mockedClient.nodes.info).toHaveBeenCalledTimes(1);
        await opensearchService.stop();
        await delay(100);
        expect(mockedClient.nodes.info).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
