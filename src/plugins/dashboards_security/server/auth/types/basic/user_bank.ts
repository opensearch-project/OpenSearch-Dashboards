/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserSchema {
  username: string;
  password?: string;
  authOption?: string;
}

export const userProfiles = new Map([
  [
    'admin',
    {
      username: 'admin',
      password: 'admin',
      authOption: 'basicauth_opensearch',
    },
  ],
  [
    'aoguan',
    {
      username: 'aoguan',
      password: 'admin',
      authOption: 'basicauth_opensearch',
    },
  ],
  [
    'aoguan@amazon.com',
    {
      username: 'aoguan@amazon.com',
      authOption: 'oidc_okta',
    },
  ],
  [
    'svc.opensearch.auth@gmail.com',
    {
      username: 'svc.opensearch.auth@gmail.com',
      authOption: 'oidc_okta',
    },
  ],
]);
