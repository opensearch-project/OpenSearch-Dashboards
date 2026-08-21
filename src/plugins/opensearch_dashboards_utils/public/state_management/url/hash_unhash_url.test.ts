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

import { mockStorage } from '../../storage/hashed_item_store/mock';
import { HashedItemStore } from '../../storage/hashed_item_store';
import { hashUrl, unhashUrl } from './hash_unhash_url';

interface Param {
  rison: string;
  hash: string;
  state: any;
}

const stateParamsFixture: { [key: string]: Param } = {
  _g: { rison: '(yes:!t)', hash: 'h@4e60e02', state: { yes: true } },
  _a: { rison: '(yes:!f)', hash: 'h@61fa078', state: { yes: false } },
  _someOther: { rison: '(yes:!f)', hash: 'willNotBeHashed', state: undefined },
  _q: { rison: '(name:opensearch)', hash: 'h@68be80e', state: { name: 'opensearch' } },
};

const createExpandedQueryParamString = (params: { [key: string]: any } = stateParamsFixture) => {
  return Object.keys(params)
    .map((key: string) => `${key}=${params[key].rison}`)
    .join('&');
};

const createHashedQueryParamString = (params: { [key: string]: Param } = stateParamsFixture) => {
  return Object.keys(params)
    .map((key: string) => `${key}=${params[key].hash}`)
    .join('&');
};

const assertParamIsInStore = (param: Param) => {
  expect(mockStorage.getItem(param.hash)).toEqual(JSON.stringify(param.state));
};

const assertPersistedIndexKeyIsPresent = () => {
  expect(mockStorage.getItem(HashedItemStore.PERSISTED_INDEX_KEY)).toBeTruthy();
};

describe('hash unhash url', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockStorage.setStubbedSizeLimit(5000000);
  });

  describe('hash url', () => {
    describe('does nothing', () => {
      it('if url is empty', () => {
        const url = '';
        expect(hashUrl(url)).toBe(url);
      });

      it('if just a host and port', () => {
        const url = 'https://localhost:5601';
        expect(hashUrl(url)).toBe(url);
      });

      it('if just a path', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards';
        expect(hashUrl(url)).toBe(url);
      });

      it('if just a path and query', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards?foo=bar';
        expect(hashUrl(url)).toBe(url);
      });

      it('if empty hash with query', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards?foo=bar#';
        expect(hashUrl(url)).toBe(url);
      });

      it('if query parameter matches and there is no hash', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards?testParam=(yes:!t)';
        expect(hashUrl(url)).toBe(url);
      });

      it(`if query parameter matches and it's before the hash`, () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards?testParam=(yes:!t)';
        expect(hashUrl(url)).toBe(url);
      });

      it('if empty hash without query', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards#';
        expect(hashUrl(url)).toBe(url);
      });

      it('if just a path with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana';
        expect(hashUrl(url)).toBe(url);
      });

      it('if just a path and query with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana?foo=bar';
        expect(hashUrl(url)).toBe(url);
      });

      it('if empty hash with query with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana?foo=bar#';
        expect(hashUrl(url)).toBe(url);
      });

      it('if query parameter matches and there is no hash with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana?testParam=(yes:!t)';
        expect(hashUrl(url)).toBe(url);
      });

      it(`if query parameter matches and it's before the hash with legacy app`, () => {
        const url = 'https://localhost:5601/app/kibana?testParam=(yes:!t)';
        expect(hashUrl(url)).toBe(url);
      });

      it('if empty hash without query with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana#';
        expect(hashUrl(url)).toBe(url);
      });

      it('if hash is just a path', () => {
        const url = 'https://localhost:5601/app/discover#/';
        expect(hashUrl(url)).toBe(url);
      });

      it('if hash does not have matching query string vals', () => {
        const url = 'https://localhost:5601/app/discover#/?foo=bar';
        expect(hashUrl(url)).toBe(url);
      });
    });

    describe('replaces expanded state with hash', () => {
      it('if uses single state param', () => {
        const stateParamKey = '_g';
        const stateParam = stateParamsFixture[stateParamKey];
        const url = `https://localhost:5601/app/discover#/?foo=bar&${stateParamKey}=${stateParam.rison}`;

        const result = hashUrl(url);

        const expectedUrl = `"https://localhost:5601/app/discover#/?foo=bar&_g=h@4e60e02"`;
        expect(result).toMatchInlineSnapshot(expectedUrl);
        assertPersistedIndexKeyIsPresent();
        assertParamIsInStore(stateParam);
      });

      it('if uses multiple states params', () => {
        const givenExpandedUrl = `https://localhost:5601/app/discover#/?foo=bar&${createExpandedQueryParamString()}`;

        const actualUrl = hashUrl(givenExpandedUrl);

        const expectedUrl = `"https://localhost:5601/app/discover#/?foo=bar&_g=h@4e60e02&_a=h@61fa078&_someOther=(yes:!f)&_q=h@68be80e"`;
        expect(actualUrl).toMatchInlineSnapshot(expectedUrl);
        assertParamIsInStore(stateParamsFixture._g);
        assertParamIsInStore(stateParamsFixture._a);
        assertParamIsInStore(stateParamsFixture._q);
        assertParamIsInStore(stateParamsFixture._g);
        if (!HashedItemStore.PERSISTED_INDEX_KEY) {
          // This is very brittle and depends upon HashedItemStore implementation details,
          // so let's protect ourselves from accidentally breaking this test.
          throw new Error('Missing HashedItemStore.PERSISTED_INDEX_KEY');
        }
        assertPersistedIndexKeyIsPresent();
        expect(mockStorage.length).toBe(4);
      });

      it('hashes only allow-listed properties', () => {
        const url = `https://localhost:5601/app/discover#/?foo=bar&${createExpandedQueryParamString()}`;

        const actualUrl = hashUrl(url);

        const expectedUrl = `"https://localhost:5601/app/discover#/?foo=bar&_g=h@4e60e02&_a=h@61fa078&_someOther=(yes:!f)&_q=h@68be80e"`;
        expect(actualUrl).toMatchInlineSnapshot(expectedUrl);
        expect(mockStorage.length).toBe(4); // 3 hashes + HashedItemStoreSingleton.PERSISTED_INDEX_KEY
      });
    });

    it('throws error if unable to hash url', () => {
      const stateParamKey = '_g';
      mockStorage.setStubbedSizeLimit(1);

      const url = `https://localhost:5601/app/discover#/?foo=bar&${stateParamKey}=${stateParamsFixture[stateParamKey].rison}`;
      expect(() => hashUrl(url)).toThrowError();
    });
  });

  describe('unhash url', () => {
    describe('does nothing', () => {
      it('if missing input', () => {
        expect(() => {
          // @ts-ignore
        }).not.toThrowError();
      });

      it('if just a host and port', () => {
        const url = 'https://localhost:5601';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if just a path', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if just a path and query', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards?foo=bar';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if empty hash with query', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards?foo=bar#';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if empty hash without query', () => {
        const url = 'https://localhost:5601/app/opensearch-dashboards#';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if just a path with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if just a path and query with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana?foo=bar';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if empty hash with query with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana?foo=bar#';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if empty hash without query with legacy app', () => {
        const url = 'https://localhost:5601/app/kibana#';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if hash is just a path', () => {
        const url = 'https://localhost:5601/app/discover#/';
        expect(unhashUrl(url)).toBe(url);
      });

      it('if hash does not have matching query string vals', () => {
        const url = 'https://localhost:5601/app/discover#/?foo=bar';
        expect(unhashUrl(url)).toBe(url);
      });

      it("if hash has matching query, but it isn't hashed", () => {
        const stateParamKey = '_g';
        const stateParamValue = '(yes:!t)';
        const url = `https://localhost:5601/app/discover#/?foo=bar&${stateParamKey}=${stateParamValue}`;
        expect(unhashUrl(url)).toBe(url);
      });
    });

    describe('replaces expanded state with hash', () => {
      it('if uses single state param', () => {
        const stateParamKey = '_g';
        const param = stateParamsFixture[stateParamKey];
        mockStorage.setItem(param.hash, JSON.stringify(param.state));
        const url = `https://localhost:5601/app/discover#/?foo=bar&${stateParamKey}=${param.hash}`;

        const actualUrl = unhashUrl(url);

        expect(actualUrl).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=(yes:!t)"`
        );
      });

      it('if uses multiple state param', () => {
        ['_g', '_a'].forEach((key) =>
          mockStorage.setItem(
            stateParamsFixture[key].hash,
            JSON.stringify(stateParamsFixture[key].state)
          )
        );
        const hashedQueryParamString = createHashedQueryParamString({
          _g: stateParamsFixture._g,
          _a: stateParamsFixture._a,
        });

        const givenUrl = `https://localhost:5601/app/discover#/?foo=bar&${hashedQueryParamString}`;
        const actualUrl = unhashUrl(givenUrl);

        const expectedExpandedUrl = `"https://localhost:5601/app/discover#/?foo=bar&_g=(yes:!t)&_a=(yes:!f)"`;
        expect(actualUrl).toMatchInlineSnapshot(expectedExpandedUrl);
      });

      it('un-hashes only allow-listed properties', () => {
        const paramKeys = Object.keys(stateParamsFixture);
        paramKeys.forEach((key) =>
          mockStorage.setItem(
            stateParamsFixture[key].hash,
            JSON.stringify(stateParamsFixture[key].state)
          )
        );
        const givenHashedUrl = `https://localhost:5601/app/discover#/?foo=bar&${createHashedQueryParamString()}`;

        const actualUrl = unhashUrl(givenHashedUrl);

        const expectedUrl = `"https://localhost:5601/app/discover#/?foo=bar&_g=(yes:!t)&_a=(yes:!f)&_someOther=willNotBeHashed&_q=(name:opensearch)"`;
        expect(actualUrl).toMatchInlineSnapshot(expectedUrl);
      });
    });

    it('throws error if unable to restore the url', () => {
      const stateParamKey1 = '_g';
      const stateParamValueHashed1 = 'h@4e60e02';

      const url = `https://localhost:5601/app/discover#/?foo=bar&${stateParamKey1}=${stateParamValueHashed1}`;
      expect(() => unhashUrl(url)).toThrowErrorMatchingInlineSnapshot(
        `"Unable to completely restore the URL, be sure to use the share functionality."`
      );
    });
  });

  describe('hash unhash url integration', () => {
    it('hashing and unhashing url should produce the same result', () => {
      const expectedUrl = `https://localhost:5601/app/discover#/?foo=bar&${createExpandedQueryParamString()}`;
      const actualUrl = unhashUrl(hashUrl(expectedUrl));

      expect(actualUrl).toEqual(expectedUrl);
    });
  });
});
