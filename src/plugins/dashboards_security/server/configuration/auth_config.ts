/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const identityProviders = new Map([
  [
    'basicauth.internal',
    {
      authOption: 'basic.internal',
    },
  ],
  [
    'oidc.okta',
    {
      authOption: 'oidc.okta',
    },
  ],
]);
