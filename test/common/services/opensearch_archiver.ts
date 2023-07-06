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

import { format as formatUrl } from 'url';
import { OpenSearchArchiver } from '@osd/opensearch-archiver';
import { FtrProviderContext } from '../ftr_provider_context';

// @ts-ignore not TS yet
import * as OpenSearchDashboardsServer from './opensearch_dashboards_server';

export function OpenSearchArchiverProvider({
  getService,
  hasService,
}: FtrProviderContext): OpenSearchArchiver {
  const config = getService('config');
  const client = getService('opensearch');
  const log = getService('log');

  if (!config.get('opensearchArchiver')) {
    throw new Error(
      `opensearchArchiver can't be used unless you specify it's config in your config file`
    );
  }

  const dataDir = config.get('opensearchArchiver.directory');

  const opensearchArchiver = new OpenSearchArchiver({
    client,
    dataDir,
    log,
    opensearchDashboardsUrl: formatUrl(config.get('servers.opensearchDashboards')),
  });

  if (hasService('opensearchDashboardsServer')) {
    OpenSearchDashboardsServer.extendOpenSearchArchiver({
      opensearchArchiver,
      opensearchDashboardsServer: getService('opensearchDashboardsServer'),
      retry: getService('retry'),
      defaults: config.get('uiSettings.defaults'),
    });
  }

  return opensearchArchiver;
}
