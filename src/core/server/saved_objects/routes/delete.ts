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
import { isManagedByCode, managedLockConflictMessage } from './managed_lock';
import { SavedObjectsErrorHelpers } from '../service';

export const registerDeleteRoute = (router: IRouter) => {
  router.delete(
    {
      path: '/{type}/{id}',
      validate: {
        params: schema.object({
          type: schema.string(),
          id: schema.string(),
        }),
        query: schema.object({
          force: schema.boolean({ defaultValue: false }),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { type, id } = req.params;
      const { force } = req.query;

      // Check managed lock before allowing delete
      if (!force) {
        try {
          const existing = await context.core.savedObjects.client.get(type, id);
          if (isManagedByCode(existing.attributes as Record<string, unknown>)) {
            return res.conflict({ body: managedLockConflictMessage(type, id) });
          }
        } catch (e: any) {
          if (!SavedObjectsErrorHelpers.isNotFoundError(e)) {
            throw e;
          }
        }
      }

      // Do not forward `force` to the client delete — it has a different meaning
      // (namespace-agnostic deletion). The lock override is handled above.
      const result = await context.core.savedObjects.client.delete(type, id);
      return res.ok({ body: result });
    })
  );
};
