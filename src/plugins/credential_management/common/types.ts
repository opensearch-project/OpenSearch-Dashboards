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

interface ICredential {
  readonly credential_name: string;
  readonly credential_type: string;
  readonly credential_material: IBasicAuthCredentialMaterial | IAWSIAMCredentialMaterial;
}

interface IBasicAuthCredentialMaterial {
  readonly user_name: string;
  readonly password: string;
}

interface IAWSIAMCredentialMaterial {
  readonly encrypted_aws_iam_credential: string;
}

export { ICredential, IBasicAuthCredentialMaterial, IAWSIAMCredentialMaterial };