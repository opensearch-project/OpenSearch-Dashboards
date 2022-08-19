/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CredentialSpec {
  title: string;
  description?: string;
}

export interface CredentialsTableItem extends CredentialSpec {
  id: string;
  sort: string;
}

export interface CreateCredentialItem extends CredentialSpec {
  username: string;
  password: string;
}

export interface EditCredentialItem extends CredentialSpec {
  id: string;
  username: string;
}
