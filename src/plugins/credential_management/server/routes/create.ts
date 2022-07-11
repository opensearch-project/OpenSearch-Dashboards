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
import { Credential } from '../../common';

const USERNAME_PASSWORD_TYPE: Credential.USERNAME_PASSWORD_TYPE = 'username_password_credential';
const AWS_IAM_TYPE: Credential.AWS_IAM_TYPE = 'aws_iam_credential';

export function registerCreateRoute(router: IRouter) {
  router.post(
    {
      path: '/api/credential_management/create',
      validate: {
        body: schema.object({
          credential_name: schema.string(),
          credential_type: schema.oneOf([
            schema.literal(USERNAME_PASSWORD_TYPE),
            schema.literal(AWS_IAM_TYPE),
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
