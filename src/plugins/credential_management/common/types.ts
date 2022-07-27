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
  readonly title: string;
  readonly credential_type: ICredentialType;
  readonly credential_material: IUserNamePasswordCredentialMaterial | IAWSIAMCredentialMaterial | undefined;
}

export type ICredentialType = IUSERNAME_PASSWORD_TYPE | IAWS_IAM_TYPE;
export type IUSERNAME_PASSWORD_TYPE = 'username_password_credential';
export type IAWS_IAM_TYPE = 'aws_iam_credential';

export interface IUserNamePasswordCredentialMaterial {
  readonly user_name: string;
  readonly password: string;
}

// TODO: Update AWS IAM credential material model
export interface IAWSIAMCredentialMaterial {
  readonly encrypted_aws_iam_credential: string;
}
