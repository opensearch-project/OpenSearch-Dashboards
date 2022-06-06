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
import moment from 'moment';
import { getOpenSearchProxyConfig } from './opensearch_proxy_config';
import https from 'https';
import http from 'http';
import { PeerCertificate } from 'tls';

const getDefaultOpenSearchConfig = () => {
  return {
    hosts: ['http://localhost:9200', 'http://192.168.1.1:1234'],
    requestTimeout: moment.duration(30000),
    ssl: { verificationMode: 'full' as const, alwaysPresentCertificate: true },
    requestHeadersWhitelist: [],
    customHeaders: {},
  };
};

describe('plugins/console', function () {
  describe('#getOpenSearchProxyConfig', function () {
    it('sets timeout', function () {
      const value = 1000;
      const proxyConfig = getOpenSearchProxyConfig({
        ...getDefaultOpenSearchConfig(),
        requestTimeout: moment.duration(value),
      });
      expect(proxyConfig.timeout).to.be(value);
    });

    it(`uses https.Agent when url's protocol is https`, function () {
      const { agent } = getOpenSearchProxyConfig({
        ...getDefaultOpenSearchConfig(),
        hosts: ['https://localhost:9200'],
      });
      expect(agent).to.be.a(https.Agent);
    });

    it(`uses http.Agent when url's protocol is http`, function () {
      const { agent } = getOpenSearchProxyConfig(getDefaultOpenSearchConfig());
      expect(agent).to.be.a(http.Agent);
    });

    describe('ssl', function () {
      const config = {
        ...getDefaultOpenSearchConfig(),
        hosts: ['https://localhost:9200'],
      };

      it('sets rejectUnauthorized to false when verificationMode is none', function () {
        const { agent } = getOpenSearchProxyConfig({
          ...config,
          ssl: { ...config.ssl, verificationMode: 'none' },
        });
        expect(agent).to.be.a(https.Agent);
        if (agent instanceof https.Agent) {
          expect(agent.options.rejectUnauthorized).to.be(false);
        }
      });

      it('sets rejectUnauthorized to true when verificationMode is certificate', function () {
        const { agent } = getOpenSearchProxyConfig({
          ...config,
          ssl: { ...config.ssl, verificationMode: 'certificate' },
        });
        expect(agent).to.be.a(https.Agent);
        if (agent instanceof https.Agent) {
          expect(agent.options.rejectUnauthorized).to.be(true);
        }
      });

      it('sets checkServerIdentity to not check hostname when verificationMode is certificate', function () {
        const { agent } = getOpenSearchProxyConfig({
          ...config,
          ssl: { ...config.ssl, verificationMode: 'certificate' },
        });

        const cert = {
          subject: {
            CN: 'wrong.com',
          },
        };

        expect(agent).to.be.a(https.Agent);
        if (agent instanceof https.Agent) {
          expect(agent.options.checkServerIdentity)
            .withArgs('right.com', cert)
            .to.not.throwException();
          const result = agent.options.checkServerIdentity?.('right.com', cert as PeerCertificate);
          expect(result).to.be(undefined);
        }
      });

      it('sets rejectUnauthorized to true when verificationMode is full', function () {
        const { agent } = getOpenSearchProxyConfig({
          ...config,
          ssl: { ...config.ssl, verificationMode: 'full' },
        });

        expect(agent).to.be.a(https.Agent);
        if (agent instanceof https.Agent) {
          expect(agent.options.rejectUnauthorized).to.be(true);
        }
      });

      it(`doesn't set checkServerIdentity when verificationMode is full`, function () {
        const { agent } = getOpenSearchProxyConfig({
          ...config,
          ssl: { ...config.ssl, verificationMode: 'full' },
        });

        expect(agent).to.be.a(https.Agent);
        if (agent instanceof https.Agent) {
          expect(agent.options.checkServerIdentity).to.be(undefined);
        }
      });

      it(`sets ca when certificateAuthorities are specified`, function () {
        const { agent } = getOpenSearchProxyConfig({
          ...config,
          ssl: { ...config.ssl, certificateAuthorities: ['content-of-some-path'] },
        });

        expect(agent).to.be.a(https.Agent);
        if (agent instanceof https.Agent) {
          expect(agent.options.ca).to.contain('content-of-some-path');
        }
      });

      describe('when alwaysPresentCertificate is false', () => {
        it(`doesn't set cert and key when certificate and key paths are specified`, function () {
          const { agent } = getOpenSearchProxyConfig({
            ...config,
            ssl: {
              ...config.ssl,
              alwaysPresentCertificate: false,
              certificate: 'content-of-some-path',
              key: 'content-of-another-path',
            },
          });

          expect(agent).to.be.a(https.Agent);
          if (agent instanceof https.Agent) {
            expect(agent.options.cert).to.be(undefined);
            expect(agent.options.key).to.be(undefined);
          }
        });

        it(`doesn't set passphrase when certificate, key and keyPassphrase are specified`, function () {
          const { agent } = getOpenSearchProxyConfig({
            ...config,
            ssl: {
              ...config.ssl,
              alwaysPresentCertificate: false,
              certificate: 'content-of-some-path',
              key: 'content-of-another-path',
              keyPassphrase: 'secret',
            },
          });

          expect(agent).to.be.a(https.Agent);
          if (agent instanceof https.Agent) {
            expect(agent.options.passphrase).to.be(undefined);
          }
        });
      });

      describe('when alwaysPresentCertificate is true', () => {
        it(`sets cert and key when certificate and key are specified`, async function () {
          const { agent } = getOpenSearchProxyConfig({
            ...config,
            ssl: {
              ...config.ssl,
              alwaysPresentCertificate: true,
              certificate: 'content-of-some-path',
              key: 'content-of-another-path',
            },
          });

          expect(agent).to.be.a(https.Agent);
          if (agent instanceof https.Agent) {
            expect(agent.options.cert).to.be('content-of-some-path');
            expect(agent.options.key).to.be('content-of-another-path');
          }
        });

        it(`sets passphrase when certificate, key and keyPassphrase are specified`, function () {
          const { agent } = getOpenSearchProxyConfig({
            ...config,
            ssl: {
              ...config.ssl,
              alwaysPresentCertificate: true,
              certificate: 'content-of-some-path',
              key: 'content-of-another-path',
              keyPassphrase: 'secret',
            },
          });

          expect(agent).to.be.a(https.Agent);
          if (agent instanceof https.Agent) {
            expect(agent.options.passphrase).to.be('secret');
          }
        });

        it(`doesn't set cert when only certificate path is specified`, async function () {
          const { agent } = getOpenSearchProxyConfig({
            ...config,
            ssl: {
              ...config.ssl,
              alwaysPresentCertificate: true,
              certificate: 'content-of-some-path',
              key: undefined,
            },
          });

          expect(agent).to.be.a(https.Agent);
          if (agent instanceof https.Agent) {
            expect(agent.options.cert).to.be(undefined);
            expect(agent.options.key).to.be(undefined);
          }
        });

        it(`doesn't set key when only key path is specified`, async function () {
          const { agent } = getOpenSearchProxyConfig({
            ...config,
            ssl: {
              ...config.ssl,
              alwaysPresentCertificate: true,
              certificate: undefined,
              key: 'content-of-some-path',
            },
          });

          expect(agent).to.be.a(https.Agent);
          if (agent instanceof https.Agent) {
            expect(agent.options.cert).to.be(undefined);
            expect(agent.options.key).to.be(undefined);
          }
        });
      });
    });
  });
});
