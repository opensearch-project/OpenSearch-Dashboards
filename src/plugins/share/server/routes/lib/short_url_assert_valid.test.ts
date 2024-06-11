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

import { shortUrlAssertValid } from './short_url_assert_valid';

const PROTOCOL_ERROR = /^Short url targets cannot have a protocol/;
const HOSTNAME_ERROR = /^Short url targets cannot have a hostname/;
const PATH_ERROR = /^Short url target path must be in the format/;

describe('shortUrlAssertValid()', () => {
  const invalid = [
    ['protocol', 'http://localhost:5601/app/opensearch-dashboards', PROTOCOL_ERROR],
    ['protocol', 'https://localhost:5601/app/opensearch-dashboards', PROTOCOL_ERROR],
    ['protocol', 'mailto:foo@bar.net', PROTOCOL_ERROR],
    ['protocol', 'javascript:alert("hi")', PROTOCOL_ERROR], // eslint-disable-line no-script-url
    ['hostname', 'localhost/app/opensearch-dashboards', PATH_ERROR], // according to spec, this is not a valid URL -- you cannot specify a hostname without a protocol
    ['hostname and port', 'local.host:5601/app/opensearch-dashboards', PROTOCOL_ERROR], // parser detects 'local.host' as the protocol
    ['hostname and auth', 'user:pass@localhost.net/app/opensearch-dashboards', PROTOCOL_ERROR], // parser detects 'user' as the protocol
    ['path traversal', '/../not-opensearch-dashboards', PATH_ERROR], // fails because first path part is not 'app'
    ['base path', '/base/app/opensearch-dashboards', PATH_ERROR], // fails because first path part is not 'app'
    ['path with an extra leading slash', '//foo/app/opensearch-dashboards', HOSTNAME_ERROR], // parser detects 'foo' as the hostname
    ['path with an extra leading slash', '///app/opensearch-dashboards', HOSTNAME_ERROR], // parser detects '' as the hostname
    ['path without app', '/foo/opensearch-dashboards', PATH_ERROR], // fails because first path part is not 'app'
    ['path without appId', '/app/', PATH_ERROR], // fails because there is only one path part (leading and trailing slashes are trimmed)
  ];

  invalid.forEach(([desc, url, error]) => {
    it(`fails when url has ${desc as string}`, () => {
      expect(() => shortUrlAssertValid(url as string)).toThrowError(error);
    });
  });

  const valid = [
    '/app/opensearch-dashboards',
    '/app/opensearch-dashboards/', // leading and trailing slashes are trimmed
    '/app/opensearch-dashboards/deeper',
    '/app/monitoring#angular/route',
    '/app/text#document-id',
    '/app/text/deeper#document-id',
    '/app/some?with=query',
    '/app/some?with=query#and-a-hash',
    '/app/some/deeper?with=query#and-a-hash',
  ];

  valid.forEach((url) => {
    it(`allows ${url}`, () => {
      shortUrlAssertValid(url);
    });
  });
});
