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
import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../core/server';

import { IUSERNAME_PASSWORD_TYPE, IAWS_IAM_TYPE } from '../../common';

const USERNAME_PASSWORD_TYPE: IUSERNAME_PASSWORD_TYPE = 'username_password_credential';
const AWS_IAM_TYPE: IAWS_IAM_TYPE = 'aws_iam_credential';

import { SavedObjectsServiceStart } from 'src/core/server';
import { CredentialAttributes } from './index';

export function registerCreateRoute(router: IRouter, saved_object: SavedObjectsServiceStart) {
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
      const { credential_name, credential_type, username_password_credential_materials, aws_iam_credential_materials } = request.body;

      const client = saved_object.getScopedClient(request);
      
      const result = await client.create<CredentialAttributes>('credential', {
        title: credential_name,
        credentialType: credential_type,
        usernamePasswordCredentialMaterials: username_password_credential_materials,
        awsIamCredentialMaterials: aws_iam_credential_materials
      })

      return response.ok({
        body: {
          time: new Date().toISOString(),
          credential_id: result.id,
          credential_name: result.attributes.title,
          credential_type: result.attributes.credentialType,
        },
      });
    }
  );
}
