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

import expect from '@osd/expect';

import { TelemetrySavedObjectAttributes } from 'src/plugins/telemetry/server/telemetry_repository';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function optInTest({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  describe('/api/telemetry/v2/optIn API', () => {
    let defaultAttributes: TelemetrySavedObjectAttributes;
    let opensearchDashboardsVersion: any;
    before(async () => {
      const opensearchDashboardsVersionAccessor = opensearchDashboardsServer.version;
      opensearchDashboardsVersion = await opensearchDashboardsVersionAccessor.get();
      defaultAttributes =
        (await getSavedObjectAttributes(supertest).catch((err) => {
          if (err.message === 'expected 200 "OK", got 404 "Not Found"') {
            return null;
          }
          throw err;
        })) || {};

      expect(typeof opensearchDashboardsVersion).to.eql('string');
      expect(opensearchDashboardsVersion.length).to.be.greaterThan(0);
    });

    afterEach(async () => {
      await updateSavedObjectAttributes(supertest, defaultAttributes);
    });

    it('should support sending false with allowChangingOptInStatus true', async () => {
      await updateSavedObjectAttributes(supertest, {
        ...defaultAttributes,
        allowChangingOptInStatus: true,
      });
      await postTelemetryV2Optin(supertest, false, 200);
      const { enabled, lastVersionChecked } = await getSavedObjectAttributes(supertest);
      expect(enabled).to.be(false);
      expect(lastVersionChecked).to.be(opensearchDashboardsVersion);
    });

    it('should support sending true with allowChangingOptInStatus true', async () => {
      await updateSavedObjectAttributes(supertest, {
        ...defaultAttributes,
        allowChangingOptInStatus: true,
      });
      await postTelemetryV2Optin(supertest, true, 200);
      const { enabled, lastVersionChecked } = await getSavedObjectAttributes(supertest);
      expect(enabled).to.be(true);
      expect(lastVersionChecked).to.be(opensearchDashboardsVersion);
    });

    it('should not support sending false with allowChangingOptInStatus false', async () => {
      await updateSavedObjectAttributes(supertest, {
        ...defaultAttributes,
        allowChangingOptInStatus: false,
      });
      await postTelemetryV2Optin(supertest, false, 400);
    });

    it('should not support sending true with allowChangingOptInStatus false', async () => {
      await updateSavedObjectAttributes(supertest, {
        ...defaultAttributes,
        allowChangingOptInStatus: false,
      });
      await postTelemetryV2Optin(supertest, true, 400);
    });

    it('should not support sending null', async () => {
      await postTelemetryV2Optin(supertest, null, 400);
    });

    it('should not support sending junk', async () => {
      await postTelemetryV2Optin(supertest, 42, 400);
    });
  });
}

async function postTelemetryV2Optin(supertest: any, value: any, statusCode: number): Promise<any> {
  const { body } = await supertest
    .post('/api/telemetry/v2/optIn')
    .set('osd-xsrf', 'xxx')
    .send({ enabled: value })
    .expect(statusCode);

  return body;
}

async function updateSavedObjectAttributes(
  supertest: any,
  attributes: TelemetrySavedObjectAttributes
): Promise<any> {
  return await supertest
    .post('/api/saved_objects/telemetry/telemetry')
    .query({ overwrite: true })
    .set('osd-xsrf', 'xxx')
    .send({ attributes })
    .expect(200);
}

async function getSavedObjectAttributes(supertest: any): Promise<TelemetrySavedObjectAttributes> {
  const { body } = await supertest.get('/api/saved_objects/telemetry/telemetry').expect(200);
  return body.attributes;
}
