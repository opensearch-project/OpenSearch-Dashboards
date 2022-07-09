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

import { IRouter } from '../../../../core/server';
import { schema } from '@osd/config-schema';
import { createHandler } from '../credential';

export function registerCreateRoute(router: IRouter) {
  router.post(
    {
      path: '/api/credential_management/create',
      validate: {
        body: schema.object({
          credential_name: schema.string(),
          credential_type: schema.oneOf([
            schema.literal('username_password_credential'),
            schema.literal('aws_iam_credential'),
          ]),
          username_password_credential_materials: schema.maybe(
            schema.object({
              user_name: schema.string(),
              password: schema.string(),
            })
          ),
          aws_iam_credential_materials: schema.maybe(
            schema.object({
              aws_iam_credential: schema.string(),
            })
          ),
        }),
      },
    },

    async (context, request, response) => {
      const savedObjectsClient = context.core.savedObjects.client;
      const attributes = await createHandler(request);
      const result = await savedObjectsClient.create('credential', attributes);
      return response.ok({
        body: {
          time: new Date().toISOString(),
          credential_id: result.id,
          credential_name: result.attributes.credential_name,
          credential_type: result.attributes.credential_type,
        },
      });
    }
  );
}
