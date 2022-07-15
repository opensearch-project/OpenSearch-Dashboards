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
import { CryptoCli } from '../crypto';
import { Credential } from '../../common';

const USERNAME_PASSWORD_TYPE: Credential.USERNAME_PASSWORD_TYPE = 'username_password_credential';
const AWS_IAM_TYPE: Credential.AWS_IAM_TYPE = 'aws_iam_credential';

// TODO: Refactor handler, add logger, etc
export async function encryptionHandler(
  credentialType: Credential.CredentialType,
  usernamePasswordCredentialMaterials: Record<string, string> | undefined,
  awsIamCredentialMaterials: Record<string, string> | undefined
) {
  const cryptoCli = CryptoCli.getInstance();
  if (credentialType === USERNAME_PASSWORD_TYPE && usernamePasswordCredentialMaterials) {
    const { user_name, password } = usernamePasswordCredentialMaterials;
    return {
      user_name,
      password: await cryptoCli.encrypt(password),
    };
  } else if (credentialType === AWS_IAM_TYPE && awsIamCredentialMaterials) {
    return {
      encrypted_aws_iam_credential: await cryptoCli.encrypt(
        awsIamCredentialMaterials.aws_iam_credential
      ),
    };
  }
}
