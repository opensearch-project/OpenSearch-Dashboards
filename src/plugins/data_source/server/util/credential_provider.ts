/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceCredentialsProviderOptions, AuthenticationMethod } from '../types';

export const authRegistryCredentialProvider = async (
  authenticationMethod: AuthenticationMethod,
  options: DataSourceCredentialsProviderOptions
) => ({
  credential: await authenticationMethod.credentialProvider(options),
  type: authenticationMethod.authType,
});
