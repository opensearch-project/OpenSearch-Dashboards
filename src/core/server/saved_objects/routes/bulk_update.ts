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
import { IRouter } from '../../http';
import { isManagedByCode } from './managed_lock';

export const registerBulkUpdateRoute = (router: IRouter) => {
  router.put(
    {
      path: '/_bulk_update',
      validate: {
        query: schema.object({
          force: schema.boolean({ defaultValue: false }),
        }),
        body: schema.arrayOf(
          schema.object({
            type: schema.string(),
            id: schema.string(),
            attributes: schema.recordOf(schema.string(), schema.any()),
            version: schema.maybe(schema.string()),
            references: schema.maybe(
              schema.arrayOf(
                schema.object({
                  name: schema.string(),
                  type: schema.string(),
                  id: schema.string(),
                })
              )
            ),
            namespace: schema.maybe(schema.string({ minLength: 1 })),
          })
        ),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { force } = req.query;

      // Check managed lock — filter out locked objects and report per-item errors
      let objectsToUpdate = req.body;
      const lockedErrors: Array<{ type: string; id: string; error: { statusCode: number; error: string; message: string } }> = [];

      if (!force) {
        const existingObjects = await context.core.savedObjects.client.bulkGet(
          req.body.map((obj) => ({ type: obj.type, id: obj.id }))
        );
        const lockedIds = new Set<string>();
        existingObjects.saved_objects.forEach((obj) => {
          if (!obj.error && isManagedByCode(obj.attributes as Record<string, unknown>)) {
            lockedIds.add(`${obj.type}:${obj.id}`);
            lockedErrors.push({
              type: obj.type,
              id: obj.id,
              error: {
                statusCode: 409,
                error: 'Conflict',
                message: `Saved object [${obj.type}/${obj.id}] is managed by code. Use \`_bulk_apply\` or add \`?force=true\`.`,
              },
            });
          }
        });
        if (lockedIds.size > 0) {
          objectsToUpdate = req.body.filter(
            (obj) => !lockedIds.has(`${obj.type}:${obj.id}`)
          );
        }
      }

      const result = await context.core.savedObjects.client.bulkUpdate(objectsToUpdate);

      // Merge locked errors into the response
      if (lockedErrors.length > 0) {
        result.saved_objects = [
          ...result.saved_objects,
          ...lockedErrors.map((err) => ({
            type: err.type,
            id: err.id,
            error: err.error as any,
            attributes: {} as any,
            references: [],
          })),
        ];
      }

      return res.ok({ body: result });
    })
  );
};
