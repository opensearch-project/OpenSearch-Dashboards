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

import { schema } from '@osd/config-schema';
import { IRouter, SavedObjectsFindOptions } from 'src/core/server';
import { findAll } from '../lib';

export const registerScrollForCountRoute = (router: IRouter) => {
  router.post(
    {
      path: '/api/opensearch-dashboards/management/saved_objects/scroll/counts',
      validate: {
        body: schema.object({
          typesToInclude: schema.arrayOf(schema.string()),
          namespacesToInclude: schema.maybe(schema.arrayOf(schema.string())),
          searchString: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { client } = context.core.savedObjects;
      const counts = {
        type: {},
      };

      const findOptions: SavedObjectsFindOptions = {
        type: req.body.typesToInclude,
        perPage: 1000,
      };

      const requestHasNamespaces =
        Array.isArray(req.body.namespacesToInclude) && req.body.namespacesToInclude.length;

      if (requestHasNamespaces) {
        counts.namespaces = {};
        findOptions.namespaces = req.body.namespacesToInclude;
      }

      if (req.body.searchString) {
        findOptions.search = `${req.body.searchString}*`;
        findOptions.searchFields = ['title'];
      }

      const objects = await findAll(client, findOptions);

      objects.forEach((result) => {
        const type = result.type;
        if (requestHasNamespaces) {
          const resultNamespaces = (result.namespaces || []).flat();
          resultNamespaces.forEach((ns) => {
            if (ns === null) {
              ns = 'default';
            }
            counts.namespaces[ns] = counts.namespaces[ns] || 0;
            counts.namespaces[ns]++;
          });
        }
        counts.type[type] = counts.type[type] || 0;
        counts.type[type]++;
      });

      for (const type of req.body.typesToInclude) {
        if (!counts.type[type]) {
          counts.type[type] = 0;
        }
      }

      const namespacesToInclude = req.body.namespacesToInclude || [];
      for (const ns of namespacesToInclude) {
        if (!counts.namespaces[ns]) {
          counts.namespaces[ns] = 0;
        }
      }

      return res.ok({
        body: counts,
      });
    })
  );
};
