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

import sinon from 'sinon';
import https, { Agent as HttpsAgent } from 'https';

import { ProxyConfig } from './proxy_config';

const matchGoogle = {
  protocol: 'https',
  host: 'google.com',
  path: '/search',
};
const parsedGoogle = new URL('https://google.com/search');
const parsedLocalOpenSearch = new URL('https://localhost:5601/search');
const defaultConfig = {
  timeout: 100,
};

describe('ProxyConfig', function () {
  describe('constructor', function () {
    let agentStub: sinon.SinonStub<HttpsAgent[], HttpsAgent>;

    beforeEach(function () {
      agentStub = sinon.stub(https, 'Agent');
    });

    afterEach(function () {
      agentStub.restore();
    });

    it('uses ca to create sslAgent', function () {
      const config = new ProxyConfig({
        ...defaultConfig,
        ssl: {
          ca: ['content-of-some-path'],
        },
      });

      // @ts-ignore private prop access
      expect(config.sslAgent).toBeInstanceOf(https.Agent);
      sinon.assert.calledOnce(agentStub);
      const sslAgentOpts = agentStub.firstCall.args[0];
      expect(sslAgentOpts).toEqual({
        ca: ['content-of-some-path'],
        cert: undefined,
        key: undefined,
        rejectUnauthorized: true,
      });
    });

    it('uses cert, and key to create sslAgent', function () {
      const config = new ProxyConfig({
        ...defaultConfig,
        ssl: {
          cert: 'content-of-some-path',
          key: 'content-of-another-path',
        },
      });

      // @ts-ignore private prop access
      expect(config.sslAgent).toBeInstanceOf(https.Agent);
      sinon.assert.calledOnce(agentStub);
      const sslAgentOpts = agentStub.firstCall.args[0];
      expect(sslAgentOpts).toEqual({
        ca: undefined,
        cert: 'content-of-some-path',
        key: 'content-of-another-path',
        rejectUnauthorized: true,
      });
    });

    it('uses ca, cert, and key to create sslAgent', function () {
      const config = new ProxyConfig({
        ...defaultConfig,
        ssl: {
          ca: ['content-of-some-path'],
          cert: 'content-of-another-path',
          key: 'content-of-yet-another-path',
        },
      });

      // @ts-ignore private prop access
      expect(config.sslAgent).toBeInstanceOf(https.Agent);
      sinon.assert.calledOnce(agentStub);
      const sslAgentOpts = agentStub.firstCall.args[0];
      expect(sslAgentOpts).toEqual({
        ca: ['content-of-some-path'],
        cert: 'content-of-another-path',
        key: 'content-of-yet-another-path',
        rejectUnauthorized: true,
      });
    });
  });

  describe('#getForParsedUri', function () {
    describe('parsed url does not match', function () {
      it('returns {}', function () {
        const config = new ProxyConfig({
          match: matchGoogle,
          timeout: 100,
        });

        expect(config.getForParsedUri(parsedLocalOpenSearch)).toEqual({});
      });
    });

    describe('parsed url does match', function () {
      it('assigns timeout value', function () {
        const timeValue = 200;
        const config = new ProxyConfig({
          match: matchGoogle,
          timeout: timeValue,
        });

        expect(config.getForParsedUri(parsedGoogle).timeout).toBe(timeValue);
      });

      it('assigns ssl.verify to rejectUnauthorized', function () {
        const configWithVerification = new ProxyConfig({
          ...defaultConfig,
          match: matchGoogle,
          ssl: {
            verify: true,
          },
        });
        const configWithoutVerification = new ProxyConfig({
          ...defaultConfig,
          match: matchGoogle,
          ssl: {
            verify: false,
          },
        });

        expect(configWithVerification.getForParsedUri(parsedGoogle).rejectUnauthorized).toBe(true);
        expect(configWithoutVerification.getForParsedUri(parsedGoogle).rejectUnauthorized).toBe(
          false
        );
      });

      describe('uri us http', function () {
        describe('ca is set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                ca: ['path/to/ca'],
              },
            });

            // @ts-ignore private prop access
            expect(config.sslAgent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'http:' }).agent).toBe(
              undefined
            );
          });
        });
        describe('cert is set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                cert: 'path/to/cert',
              },
            });

            // @ts-ignore private prop access
            expect(config.sslAgent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'http:' }).agent).toBe(
              undefined
            );
          });
        });
        describe('key is set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                key: 'path/to/key',
              },
            });

            // @ts-ignore private prop access
            expect(config.sslAgent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'http:' }).agent).toBe(
              undefined
            );
          });
        });
        describe('cert + key are set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                cert: 'path/to/cert',
                key: 'path/to/key',
              },
            });

            // @ts-ignore private prop access
            expect(config.sslAgent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'http:' }).agent).toBe(
              undefined
            );
          });
        });
      });

      describe('uri us https', function () {
        describe('ca is set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                ca: ['path/to/ca'],
              },
            });

            // @ts-ignore private prop access
            const agent = config.sslAgent;
            expect(agent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'https:' }).agent).toBe(
              agent
            );
          });
        });
        describe('cert is set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                cert: 'path/to/cert',
              },
            });

            // @ts-ignore private prop access
            const agent = config.sslAgent;
            expect(agent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'https:' }).agent).toBe(
              agent
            );
          });
        });
        describe('key is set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                key: 'path/to/key',
              },
            });

            // @ts-ignore private prop access
            const agent = config.sslAgent;
            expect(agent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'https:' }).agent).toBe(
              agent
            );
          });
        });
        describe('cert + key are set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ...defaultConfig,
              ssl: {
                cert: 'path/to/cert',
                key: 'path/to/key',
              },
            });

            // @ts-ignore private prop access
            const agent = config.sslAgent;
            expect(agent).toBeInstanceOf(HttpsAgent);
            expect(config.getForParsedUri({ ...parsedGoogle, protocol: 'https:' }).agent).toBe(
              agent
            );
          });
        });
      });
    });
  });
});
