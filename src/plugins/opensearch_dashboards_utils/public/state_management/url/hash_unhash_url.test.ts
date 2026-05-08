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
  state: Record<string, unknown>;
}

const stateParamsFixture: Record<string, Param> = {
  _g: { rison: '(yes:!t)', hash: 'h@4e60e02', state: { yes: true } },
  _a: { rison: '(yes:!f)', hash: 'h@61fa078', state: { yes: false } },
  _s: { rison: '(sort:!())', hash: 'h@76b2d97', state: { sort: [] } },
  _someOther: { rison: '(yes:!f)', hash: 'willNotBeHashed', state: { yes: false } },
  _q: { rison: '(name:opensearch)', hash: 'h@68be80e', state: { name: 'opensearch' } },
  _v: { rison: '(type:line)', hash: 'h@50e2e8b', state: { type: 'line' } },
};

const createExpandedQueryParamString = (
  params: Record<string, Param> = stateParamsFixture
): string =>
  Object.entries(params)
    .map(([key, { rison }]) => `${key}=${rison}`)
    .join('&');

const createHashedQueryParamString = (params: Record<string, Param> = stateParamsFixture): string =>
  Object.entries(params)
    .map(([key, { hash }]) => `${key}=${hash}`)
    .join('&');

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
        const { rison, hash, state } = stateParamsFixture._g;
        const url = `https://localhost:5601/app/discover#/?foo=bar&_g=${rison}`;

        const result = hashUrl(url);

        expect(result).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=h@4e60e02"`
        );
        assertPersistedIndexKeyIsPresent();
        expect(mockStorage.getItem(hash)).toEqual(JSON.stringify(state));
      });

      it('if uses multiple states params', () => {
        const url = `https://localhost:5601/app/discover#/?foo=bar&${createExpandedQueryParamString()}`;

        const result = hashUrl(url);

        expect(result).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=h@4e60e02&_a=h@61fa078&_s=h@76b2d97&_someOther=(yes:!f)&_q=h@68be80e&_v=h@50e2e8b"`
        );
        assertParamIsInStore(stateParamsFixture._g);
        assertParamIsInStore(stateParamsFixture._a);
        assertParamIsInStore(stateParamsFixture._s);
        assertParamIsInStore(stateParamsFixture._q);
        assertParamIsInStore(stateParamsFixture._v);
        if (!HashedItemStore.PERSISTED_INDEX_KEY) {
          // This is very brittle and depends upon HashedItemStore implementation details,
          // so let's protect ourselves from accidentally breaking this test.
          throw new Error('Missing HashedItemStore.PERSISTED_INDEX_KEY');
        }
        assertPersistedIndexKeyIsPresent();
        expect(mockStorage.length).toBe(6); // 5 hashes (_g, _a, _s, _q, _v) + HashedItemStore.PERSISTED_INDEX_KEY
      });

      it('hashes only allow-listed properties', () => {
        const url = `https://localhost:5601/app/discover#/?foo=bar&${createExpandedQueryParamString()}`;

        const result = hashUrl(url);

        expect(result).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=h@4e60e02&_a=h@61fa078&_s=h@76b2d97&_someOther=(yes:!f)&_q=h@68be80e&_v=h@50e2e8b"`
        );
        expect(mockStorage.length).toBe(6); // 5 hashes (_g, _a, _s, _q, _v) + HashedItemStore.PERSISTED_INDEX_KEY
      });
    });

    it('throws error if unable to hash url', () => {
      const { rison } = stateParamsFixture._g;
      mockStorage.setStubbedSizeLimit(1);

      const url = `https://localhost:5601/app/discover#/?foo=bar&_g=${rison}`;
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
        const { rison } = stateParamsFixture._g;
        const url = `https://localhost:5601/app/discover#/?foo=bar&_g=${rison}`;
        expect(unhashUrl(url)).toBe(url);
      });
    });

    describe('replaces hashed state with expanded state', () => {
      it('if uses single state param', () => {
        const { hash, state } = stateParamsFixture._g;
        mockStorage.setItem(hash, JSON.stringify(state));

        const url = `https://localhost:5601/app/discover#/?foo=bar&_g=${hash}`;
        const result = unhashUrl(url);

        expect(result).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=(yes:!t)"`
        );
      });

      it('if uses multiple state params', () => {
        ['_g', '_a'].forEach((key) => {
          const { hash, state } = stateParamsFixture[key];
          mockStorage.setItem(hash, JSON.stringify(state));
        });
        const hashedUrl = `https://localhost:5601/app/discover#/?foo=bar&${createHashedQueryParamString(
          { _g: stateParamsFixture._g, _a: stateParamsFixture._a }
        )}`;

        const result = unhashUrl(hashedUrl);

        expect(result).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=(yes:!t)&_a=(yes:!f)"`
        );
      });

      it('un-hashes _s, _q, and _v in addition to _g and _a', () => {
        ['_g', '_a', '_s', '_q', '_v'].forEach((key) => {
          const { hash, state } = stateParamsFixture[key];
          mockStorage.setItem(hash, JSON.stringify(state));
        });
        const hashedUrl = `https://localhost:5601/app/discover#/?foo=bar&${createHashedQueryParamString(
          {
            _g: stateParamsFixture._g,
            _a: stateParamsFixture._a,
            _s: stateParamsFixture._s,
            _q: stateParamsFixture._q,
            _v: stateParamsFixture._v,
          }
        )}`;

        const result = unhashUrl(hashedUrl);

        expect(result).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=(yes:!t)&_a=(yes:!f)&_s=(sort:!())&_q=(name:opensearch)&_v=(type:line)"`
        );
      });

      it('un-hashes only allow-listed properties', () => {
        Object.values(stateParamsFixture).forEach(({ hash, state }) => {
          mockStorage.setItem(hash, JSON.stringify(state));
        });
        const hashedUrl = `https://localhost:5601/app/discover#/?foo=bar&${createHashedQueryParamString()}`;

        const result = unhashUrl(hashedUrl);

        expect(result).toMatchInlineSnapshot(
          `"https://localhost:5601/app/discover#/?foo=bar&_g=(yes:!t)&_a=(yes:!f)&_s=(sort:!())&_someOther=willNotBeHashed&_q=(name:opensearch)&_v=(type:line)"`
        );
      });
    });

    it('throws error if unable to restore the url', () => {
      const { hash } = stateParamsFixture._g;
      const url = `https://localhost:5601/app/discover#/?foo=bar&_g=${hash}`;

      expect(() => unhashUrl(url)).toThrowErrorMatchingInlineSnapshot(
        `"Unable to completely restore the URL, be sure to use the share functionality."`
      );
    });
  });

  describe('hash unhash url integration', () => {
    it('hashing and unhashing url should produce the same result', () => {
      const url = `https://localhost:5601/app/discover#/?foo=bar&${createExpandedQueryParamString()}`;
      const result = unhashUrl(hashUrl(url));
      expect(result).toEqual(url);
    });

    it('share url flow: unhashUrl produces a portable url with all state params expanded', () => {
      // Simulate the share URL generation: first hash the URL (as osdUrlStateStorage does),
      // then unhash it (as the share panel does via shareableUrl).
      const expandedUrl = `https://localhost:5601/app/discover#/?foo=bar&${createExpandedQueryParamString(
        {
          _g: stateParamsFixture._g,
          _a: stateParamsFixture._a,
          _s: stateParamsFixture._s,
          _q: stateParamsFixture._q,
          _v: stateParamsFixture._v,
        }
      )}`;
      const hashedUrl = hashUrl(expandedUrl);

      // All params should be hashed
      expect(hashedUrl).toMatchInlineSnapshot(
        `"https://localhost:5601/app/discover#/?foo=bar&_g=h@4e60e02&_a=h@61fa078&_s=h@76b2d97&_q=h@68be80e&_v=h@50e2e8b"`
      );

      // unhashUrl (used by share panel) must expand all params so the URL is portable
      const shareableUrl = unhashUrl(hashedUrl);
      expect(shareableUrl).toEqual(expandedUrl);
    });
  });
});
