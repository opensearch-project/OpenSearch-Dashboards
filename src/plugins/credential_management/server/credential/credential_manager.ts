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

import { OpenSearchDashboardsRequest } from 'opensearch-dashboards/server';
import { CryptoCli } from '../crypto';
import { Credential } from '../../common';

const USERNAME_PASSWORD_TYPE: Credential.USERNAME_PASSWORD_TYPE = 'username_password_credential';
const AWS_IAM_TYPE: Credential.AWS_IAM_TYPE = 'aws_iam_credential';

// TODO: Refactor handler, add logger, etc
export async function createHandler(request: OpenSearchDashboardsRequest) {
  const cryptoCli = CryptoCli.getInstance();
  if (request.body.credential_type === USERNAME_PASSWORD_TYPE) {
    const basicAuthCredentialMaterial: Credential.IBasicAuthCredentialMaterial = {
      user_name: request.body.username_password_credential_materials.user_name,
      password: await cryptoCli.encrypt(
        request.body.username_password_credential_materials.password
      ),
    };
    return {
      credential_name: request.body.credential_name,
      credential_type: request.body.credential_type,
      credential_material: basicAuthCredentialMaterial,
    };
  } else if (request.body.credential_type === AWS_IAM_TYPE) {
    const aWSIAMCredentialMaterial: Credential.IAWSIAMCredentialMaterial = {
      encrypted_aws_iam_credential: await cryptoCli.encrypt(
        request.body.username_password_credential_materials.password
      ),
    };
    return {
      credential_name: request.body.credential_name,
      credential_type: request.body.credential_type,
      credential_material: aWSIAMCredentialMaterial,
    };
  }
}
