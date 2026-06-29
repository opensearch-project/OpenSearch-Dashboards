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

import supertest from 'supertest';
import { BehaviorSubject } from 'rxjs';
import { ByteSizeValue } from '@osd/config-schema';
import { REPO_ROOT } from '@osd/dev-utils';
import { HttpService, InternalHttpServiceSetup } from '../../http';
import { contextServiceMock } from '../../context/context_service.mock';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import { Env } from '../../config';
import { configServiceMock, getEnvOptions } from '../../config/mocks';
import { CapabilitiesService, CapabilitiesSetup } from '..';
import { createHttpServer } from '../../http/test_utils';
import { dynamicConfigServiceMock } from '../../config/dynamic_config_service.mock';

const coreId = Symbol('core');

const env = Env.createDefault(REPO_ROOT, getEnvOptions());

describe('CapabilitiesService', () => {
  let server: HttpService;
  let httpSetup: InternalHttpServiceSetup;

  let service: CapabilitiesService;
  let serviceSetup: CapabilitiesSetup;

  beforeEach(async () => {
    server = createHttpServer();
    httpSetup = await server.setup({
      context: contextServiceMock.createSetupContract(),
    });
    service = new CapabilitiesService({
      coreId,
      env,
      logger: loggingSystemMock.create(),
      configService: {} as any,
      dynamicConfigService: dynamicConfigServiceMock.create(),
    });
    serviceSetup = await service.setup({ http: httpSetup });
    await server.start({
      dynamicConfigService: dynamicConfigServiceMock.createInternalStartContract(),
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('/api/core/capabilities route', () => {
    it('is exposed', async () => {
      const result = await supertest(httpSetup.server.listener)
        .post('/api/core/capabilities')
        .send({ applications: [] })
        .expect(200);
      expect(result.body).toMatchInlineSnapshot(`
              Object {
                "catalogue": Object {},
                "management": Object {},
                "navLinks": Object {},
                "workspaces": Object {},
              }
          `);
    });

    it('uses the service capabilities providers', async () => {
      serviceSetup.registerProvider(() => ({
        catalogue: {
          something: true,
        },
      }));

      const result = await supertest(httpSetup.server.listener)
        .post('/api/core/capabilities')
        .send({ applications: [] })
        .expect(200);
      expect(result.body).toMatchInlineSnapshot(`
        Object {
          "catalogue": Object {
            "something": true,
          },
          "management": Object {},
          "navLinks": Object {},
          "workspaces": Object {},
        }
      `);
    });

    describe('request body schema bounds', () => {
      beforeEach(async () => {
        await server.stop();
        const configService = configServiceMock.create();
        configService.atPath.mockReturnValue(
          new BehaviorSubject({
            hosts: ['localhost'],
            maxPayload: new ByteSizeValue(10 * 1024 * 1024),
            autoListen: true,
            ssl: { enabled: false },
            compression: { enabled: true },
            xsrf: { disableProtection: true, whitelist: [] },
            customResponseHeaders: {},
            requestId: { allowFromAnyIp: true, ipAllowlist: [] },
            keepaliveTimeout: 120_000,
            socketTimeout: 120_000,
          } as any)
        );
        server = createHttpServer({ configService });
        httpSetup = await server.setup({
          context: contextServiceMock.createSetupContract(),
        });
        service = new CapabilitiesService({
          coreId,
          env,
          logger: loggingSystemMock.create(),
          configService: {} as any,
          dynamicConfigService: dynamicConfigServiceMock.create(),
        });
        serviceSetup = await service.setup({ http: httpSetup });
        await server.start({
          dynamicConfigService: dynamicConfigServiceMock.createInternalStartContract(),
        });
      });

      it('accepts an applications array at the maximum allowed size (1000)', async () => {
        const applications = Array.from({ length: 1000 }, (_, i) => `app-${i}`);
        await supertest(httpSetup.server.listener)
          .post('/api/core/capabilities')
          .send({ applications })
          .expect(200);
      });

      it('rejects an applications array larger than 1000 entries', async () => {
        const applications = Array.from({ length: 1001 }, (_, i) => `app-${i}`);
        await supertest(httpSetup.server.listener)
          .post('/api/core/capabilities')
          .send({ applications })
          .expect(400);
      });

      it('rejects an application id longer than 256 characters', async () => {
        const tooLong = 'a'.repeat(257);
        await supertest(httpSetup.server.listener)
          .post('/api/core/capabilities')
          .send({ applications: [tooLong] })
          .expect(400);
      });

      it('accepts an application id of exactly 256 characters', async () => {
        const maxLen = 'a'.repeat(256);
        await supertest(httpSetup.server.listener)
          .post('/api/core/capabilities')
          .send({ applications: [maxLen] })
          .expect(200);
      });
    });
  });
});
