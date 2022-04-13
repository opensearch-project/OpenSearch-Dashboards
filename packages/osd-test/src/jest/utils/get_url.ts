/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import url from 'url';

interface UrlParam {
  hash?: string;
  host?: string;
  hostname?: string;
  href?: string;
  password?: string;
  pathname?: string;
  port?: number;
  protocol?: string;
  search?: string;
  username?: string;
}

interface App {
  pathname?: string;
  hash?: string;
}

/**
 * Converts a config and a pathname to a url
 * @param {object} config A url config
 *   example:
 *   {
 *      protocol: 'http',
 *      hostname: 'localhost',
 *      port: 9220,
 *      auth: opensearchDashboardsTestUser.username + ':' + opensearchDashboardsTestUser.password
 *   }
 * @param {object} app The params to append
 *   example:
 *   {
 *      pathname: 'app/opensearch-dashboards',
 *      hash: '/discover'
 *   }
 * @return {string}
 */

function getUrl(config: UrlParam, app: App) {
  return url.format(_.assign({}, config, app));
}

getUrl.noAuth = function getUrlNoAuth(config: UrlParam, app: App) {
  config = _.pickBy(config, function (val, param) {
    return param !== 'auth';
  });
  return getUrl(config, app);
};

getUrl.baseUrl = function getBaseUrl(config: UrlParam) {
  return url.format(_.pick(config, 'protocol', 'hostname', 'port'));
};

export { getUrl };
