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

import type { ParsedQuery } from 'query-string';
import { replaceUrlHashQuery, replaceUrlQuery } from './format';

describe('format', () => {
  describe('replaceUrlHashQuery', () => {
    it('should add hash query to url without hash', () => {
      const url = 'http://localhost:5601/oxf/app/opensearch-dashboards';
      expect(replaceUrlHashQuery(url, () => ({ test: 'test' }))).toMatchInlineSnapshot(
        `"http://localhost:5601/oxf/app/opensearch-dashboards#?test=test"`
      );
    });

    it('should replace hash query', () => {
      const url = 'http://localhost:5601/oxf/app/opensearch-dashboards#?test=test';
      expect(
        replaceUrlHashQuery(url, (query) => ({
          ...query,
          test1: 'test1',
        }))
      ).toMatchInlineSnapshot(
        `"http://localhost:5601/oxf/app/opensearch-dashboards#?test=test&test1=test1"`
      );
    });

    it('should add hash query to url without hash with legacy app', () => {
      const url = 'http://localhost:5601/oxf/app/kibana';
      expect(replaceUrlHashQuery(url, () => ({ test: 'test' }))).toMatchInlineSnapshot(
        `"http://localhost:5601/oxf/app/kibana#?test=test"`
      );
    });

    it('should replace hash query with legacy app', () => {
      const url = 'http://localhost:5601/oxf/app/kibana#?test=test';
      expect(
        replaceUrlHashQuery(url, (query) => ({
          ...query,
          test1: 'test1',
        }))
      ).toMatchInlineSnapshot(`"http://localhost:5601/oxf/app/kibana#?test=test&test1=test1"`);
    });
  });
});

// Expected values were produced by the `url.parse()`-based implementation on Node 22.23.4,
// so these pin the WHATWG-based parser to the old output for real Dashboards URLs.
describe('format output is unchanged from the url.parse() implementation', () => {
  const addQuery = (query: ParsedQuery) => ({ ...query, _z: '(a:!t)' });
  const cases: Array<[string, { query: string; hashQuery: string; hashIdentity: string }]> = [
    [
      'http://localhost:5601/app/home?x=1#y',
      {
        query: 'http://localhost:5601/app/home?x=1&_z=(a:!t)#y',
        hashQuery: 'http://localhost:5601/app/home?x=1#y?_z=(a:!t)',
        hashIdentity: 'http://localhost:5601/app/home?x=1#y',
      },
    ],
    [
      'http://localhost/app/dashboards#/view/abc?_g=(filters:!(),refreshInterval:(pause:!t,value:0))&_a=(query:(language:kuery,query:%27%27))',
      {
        query:
          'http://localhost/app/dashboards?_z=(a:!t)#/view/abc?_g=(filters:!(),refreshInterval:(pause:!t,value:0))&_a=(query:(language:kuery,query:%27%27))',
        hashQuery:
          "http://localhost/app/dashboards#/view/abc?_g=(filters:!(),refreshInterval:(pause:!t,value:0))&_a=(query:(language:kuery,query:''))&_z=(a:!t)",
        hashIdentity:
          "http://localhost/app/dashboards#/view/abc?_g=(filters:!(),refreshInterval:(pause:!t,value:0))&_a=(query:(language:kuery,query:''))",
      },
    ],
    [
      'http://localhost:5601/base/app/discover#/?_g=()&_a=(columns:!(_source))',
      {
        query: 'http://localhost:5601/base/app/discover?_z=(a:!t)#/?_g=()&_a=(columns:!(_source))',
        hashQuery:
          'http://localhost:5601/base/app/discover#/?_g=()&_a=(columns:!(_source))&_z=(a:!t)',
        hashIdentity: 'http://localhost:5601/base/app/discover#/?_g=()&_a=(columns:!(_source))',
      },
    ],
    [
      '/app/discover?foo=bar&foo=baz#/x?y=1',
      {
        query: '/app/discover?foo=bar,baz&_z=(a:!t)#/x?y=1',
        hashQuery: '/app/discover?foo=bar&foo=baz#/x?y=1&_z=(a:!t)',
        hashIdentity: '/app/discover?foo=bar&foo=baz#/x?y=1',
      },
    ],
    [
      '/app/x?q=a+b&r=%20c&s=%E2%9C%93&t=&u',
      {
        query: '/app/x?q=a%20b&r=%20c&s=%E2%9C%93&t=&u=&_z=(a:!t)',
        hashQuery: '/app/x?q=a+b&r=%20c&s=%E2%9C%93&t=&u#?_z=(a:!t)',
        hashIdentity: '/app/x?q=a+b&r=%20c&s=%E2%9C%93&t=&u',
      },
    ],
    [
      'https://dashboards.example.com/_dashboards/app/home#/',
      {
        query: 'https://dashboards.example.com/_dashboards/app/home?_z=(a:!t)#/',
        hashQuery: 'https://dashboards.example.com/_dashboards/app/home#/?_z=(a:!t)',
        hashIdentity: 'https://dashboards.example.com/_dashboards/app/home#/',
      },
    ],
  ];

  it.each(cases)('%s', (url, expected) => {
    expect(replaceUrlQuery(url, addQuery)).toBe(expected.query);
    expect(replaceUrlHashQuery(url, addQuery)).toBe(expected.hashQuery);
    expect(replaceUrlHashQuery(url, (query) => query)).toBe(expected.hashIdentity);
  });
});
