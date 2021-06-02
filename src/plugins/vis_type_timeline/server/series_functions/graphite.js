/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { i18n } from '@osd/i18n';
import _ from 'lodash';
import fetch from 'node-fetch';
import moment from 'moment';
import Datasource from '../lib/classes/datasource';
import dns from 'dns-sync';
import IPCIDR from 'ip-cidr';

const MISS_CHECKLIST_MESSAGE = `Please configure on the opensearch_dashbpards.yml file. 
You can always enable the default allowlist configuration.`;

const INVALID_URL_MESSAGE = `The Graphite URL/IP provided by you is invalid. 
Please update your config from OpenSearch Dashboards's Advanced Setting.`;

/**
 * Resolve hostname to IP address
 * @param {object} urlObject
 * @returns {string} configuredIP
 * or null if it cannot be resolve
 * According to RFC, all IPv6 IP address needs to be in []
 * such as [::1]
 * So if we detect a IPv6 address, we remove brackets
 */
function getIpAddress(urlObject) {
  const hostname = urlObject.hostname;
  const configuredIP = dns.resolve(hostname);
  if (configuredIP) {
    return configuredIP;
  }
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.substr(1).slice(0, -1);
  }
  return null;
}

function isValidURL(configuredUrl, blockedIPs) {
  // Check the format of URL, URL has be in the format as
  // scheme://server/path/resource otherwise an TypeError
  // would be thrown
  let configuredUrlObject;
  try {
    configuredUrlObject = new URL(configuredUrl);
  } catch (err) {
    return false;
  }

  const ip = getIpAddress(configuredUrlObject);
  if (!ip) {
    return false;
  }

  // IPCIDR check if a specific IP address fall in the
  // range of an IP address block
  // @param {string} bl
  // @returns {object} cidr
  const isBlocked = blockedIPs.some((blockedIP) => new IPCIDR(blockedIP).contains(ip));
  return !isBlocked;
}

/**
 * Check configured url using blocklist and allowlist
 * If allowlist is used, return false if allowlist does not contain configured url
 * If blocklist is used, return false if blocklist contains configured url
 * If both allowlist and blocklist are used, check blocklist first then allowlist
 * @param {Array|string} blockedIPs
 * @param {Array|string} allowedUrls
 * @param {string} configuredUrls
 * @returns {boolean} true if the configuredUrl is valid
 */
function isValidConfig(blockedIPs, allowedUrls, configuredUrl) {
  if (blockedIPs.length === 0) {
    if (!allowedUrls.includes(configuredUrl)) return false;
  } else if (allowedUrls.length === 0) {
    if (!isValidURL(configuredUrl, blockedIPs)) return false;
  } else {
    if (!isValidURL(configuredUrl, blockedIPs) || !allowedUrls.includes(configuredUrl))
      return false;
  }
  return true;
}

export default new Datasource('graphite', {
  args: [
    {
      name: 'metric', // _test-data.users.*.data
      types: ['string'],
      help: i18n.translate('timeline.help.functions.graphite.args.metricHelpText', {
        defaultMessage: 'Graphite metric to pull, e.g., {metricExample}',
        values: {
          metricExample: '_test-data.users.*.data',
        },
      }),
    },
  ],
  help: i18n.translate('timeline.help.functions.graphiteHelpText', {
    defaultMessage: `[experimental] Pull data from graphite. Configure your graphite server in OpenSearch Dashboards's Advanced Settings`,
  }),
  fn: function graphite(args, tlConfig) {
    const config = args.byName;

    const time = {
      min: moment(tlConfig.time.from).format('HH:mm[_]YYYYMMDD'),
      max: moment(tlConfig.time.to).format('HH:mm[_]YYYYMMDD'),
    };

    const allowedUrls = tlConfig.allowedGraphiteUrls;
    const blockedIPs = tlConfig.blockedGraphiteIPs;
    const configuredUrl = tlConfig.settings['timeline:graphite.url'];

    if (allowedUrls.length === 0 && blockedIPs.length === 0) {
      throw new Error(
        i18n.translate('timeline.help.functions.missCheckGraphiteConfig', {
          defaultMessage: MISS_CHECKLIST_MESSAGE,
        })
      );
    }

    if (!isValidConfig(blockedIPs, allowedUrls, configuredUrl)) {
      throw new Error(
        i18n.translate('timeline.help.functions.invalidGraphiteConfig', {
          defaultMessage: INVALID_URL_MESSAGE,
        })
      );
    }

    const GRAPHITE_URL =
      tlConfig.settings['timeline:graphite.url'] +
      '/render/' +
      '?format=json' +
      '&from=' +
      time.min +
      '&until=' +
      time.max +
      '&target=' +
      config.metric;

    return fetch(GRAPHITE_URL, { redirect: 'error' })
      .then(function (resp) {
        return resp.json();
      })
      .then(function (resp) {
        const list = _.map(resp, function (series) {
          const data = _.map(series.datapoints, function (point) {
            return [point[1] * 1000, point[0]];
          });
          return {
            data: data,
            type: 'series',
            fit: 'nearest', // TODO make this customizable
            label: series.target,
          };
        });

        return {
          type: 'seriesList',
          list: list,
        };
      })
      .catch(function (e) {
        throw e;
      });
  },
});
