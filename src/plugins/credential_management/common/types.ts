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

// TODO: refactor the credential in heritance:
export interface ICredential {
  readonly credential_name: string;
  readonly credential_type: CredentialType;
  readonly credential_material: IUserNamePasswordCredentialMaterial | IAWSIAMCredentialMaterial;
}

export type CredentialType = USERNAME_PASSWORD_TYPE | AWS_IAM_TYPE;
export type USERNAME_PASSWORD_TYPE = 'username_password_credential';
export type AWS_IAM_TYPE = 'aws_iam_credential';

export interface IUserNamePasswordCredentialMaterial {
  readonly user_name: string;
  readonly password: string;
}

// TODO: Update AWS IAM credential material model
export interface IAWSIAMCredentialMaterial {
  readonly encrypted_aws_iam_credential: string;
}
