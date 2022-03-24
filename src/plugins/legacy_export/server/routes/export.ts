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

import moment from 'moment';
import { schema } from '@osd/config-schema';
import { IRouter } from 'src/core/server';
import { exportDashboards } from '../lib';

export const registerExportRoute = (router: IRouter, opensearchDashboardsVersion: string) => {
  router.get(
    {
      path: '/api/opensearch-dashboards/dashboards/export',
      validate: {
        query: schema.object({
          dashboard: schema.oneOf([schema.string(), schema.arrayOf(schema.string())]),
        }),
      },
      options: {
        tags: ['api'],
      },
    },
    async (ctx, req, res) => {
      const ids = Array.isArray(req.query.dashboard) ? req.query.dashboard : [req.query.dashboard];
      const { client } = ctx.core.savedObjects;

      const exported = await exportDashboards(ids, client, opensearchDashboardsVersion);
      const filename = `opensearch-dashboards-dashboards.${moment
        .utc()
        .format('YYYY-MM-DD-HH-mm-ss')}.json`;
      const body = JSON.stringify(exported, null, '  ');

      return res.ok({
        body,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'application/json',
          'Content-Length': `${Buffer.byteLength(body, 'utf8')}`,
        },
      });
    }
  );
};
