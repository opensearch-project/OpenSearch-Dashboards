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

const expect = require('chai').expect;

import fn from './graphite';

const MISS_CHECKLIST_MESSAGE = `Please configure on the opensearch_dashboards.yml file.
You can always enable the default allowlist configuration.`;

const INVALID_URL_MESSAGE = `The Graphite URL provided by you is invalid.
Please update your config from OpenSearch Dashboards's Advanced Setting.`;

jest.mock('node-fetch', () => (url) => {
  if (url.includes('redirect')) {
    return Promise.reject(new Error('maximum redirect reached at: ' + url));
  }
  return Promise.resolve({
    json: function () {
      return [
        {
          target: '__beer__',
          datapoints: [
            [3, 1000],
            [14, 2000],
            [1.5, 3000],
            [92.6535, 4000],
          ],
        },
      ];
    },
  });
});

import invoke from './helpers/invoke_series_fn.js';

describe('graphite', function () {
  it('should wrap the graphite response up in a seriesList', function () {
    return invoke(fn, [], {
      allowedGraphiteUrls: ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      blockedGraphiteIPs: [],
    }).then(function (result) {
      expect(result.output.list[0].data[0][1]).to.eql(3);
      expect(result.output.list[0].data[1][1]).to.eql(14);
    });
  });

  it('should convert the seconds to milliseconds', function () {
    return invoke(fn, [], {
      allowedGraphiteUrls: ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      blockedGraphiteIPs: [],
    }).then(function (result) {
      expect(result.output.list[0].data[1][0]).to.eql(2000 * 1000);
    });
  });

  it('should set the label to that of the graphite target', function () {
    return invoke(fn, [], {
      allowedGraphiteUrls: ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      blockedGraphiteIPs: [],
    }).then(function (result) {
      expect(result.output.list[0].label).to.eql('__beer__');
    });
  });

  it('should return error message if both allowlist and blockedlist are disabled', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'http://127.0.0.1' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: [],
    }).catch((e) => {
      expect(e.message).to.eql(MISS_CHECKLIST_MESSAGE);
    });
  });

  it('should return error message if both allowlist and denylist are disabled', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'http://127.0.0.1' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: [],
    }).catch((e) => {
      expect(e.message).to.eql(MISS_CHECKLIST_MESSAGE);
    });
  });

  it('setting with matched allowlist url should return result', function () {
    return invoke(fn, [], {
      settings: {
        'timeline:graphite.url': 'https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite',
      },
      allowedGraphiteUrls: ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      blockedGraphiteIPs: [],
    }).then((result) => {
      expect(result.output.list.length).to.eql(1);
    });
  });

  it('setting with unmatched allowlist url should return error message', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'http://127.0.0.1' },
      allowedGraphiteUrls: ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      blockedGraphiteIPs: [],
    }).catch((e) => {
      expect(e.message).to.eql(INVALID_URL_MESSAGE);
    });
  });

  it('setting with matched denylist url should return error message', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'http://127.0.0.1' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).catch((e) => {
      expect(e.message).to.eql(INVALID_URL_MESSAGE);
    });
  });

  it('setting with matched denylist localhost should return error message', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'http://localhost' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).catch((e) => {
      expect(e.message).to.eql(INVALID_URL_MESSAGE);
    });
  });

  it('setting with unmatched denylist https url should return result', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'https://opensearch.org/' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).then((result) => {
      expect(result.output.list.length).to.eql(1);
    });
  });

  it('setting with unmatched denylist ftp url should return result', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'ftp://www.opensearch.org' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).then((result) => {
      expect(result.output.list.length).to.eql(1);
    });
  });

  it('setting with invalid url should return error message', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'www.opensearch.org' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).catch((e) => {
      expect(e.message).to.eql(INVALID_URL_MESSAGE);
    });
  });

  it('setting with redirection error message', function () {
    return invoke(fn, [], {
      settings: { 'timeline:graphite.url': 'https://opensearch.org/redirect' },
      allowedGraphiteUrls: [],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).catch((e) => {
      expect(e.message).to.includes('maximum redirect reached');
    });
  });

  it('with both allowlist and denylist, setting not in denylist but in allowlist should return result', function () {
    return invoke(fn, [], {
      settings: {
        'timeline:graphite.url': 'https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite',
      },
      allowedGraphiteUrls: ['https://www.hostedgraphite.com/UID/ACCESS_KEY/graphite'],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).then((result) => {
      expect(result.output.list.length).to.eql(1);
    });
  });

  it('with conflict allowlist and denylist, setting in denylist and in allowlist should return error message', function () {
    return invoke(fn, [], {
      settings: {
        'timeline:graphite.url': 'http://127.0.0.1',
      },
      allowedGraphiteUrls: ['http://127.0.0.1'],
      blockedGraphiteIPs: ['127.0.0.0/8'],
    }).catch((e) => {
      expect(e.message).to.eql(INVALID_URL_MESSAGE);
    });
  });
});
