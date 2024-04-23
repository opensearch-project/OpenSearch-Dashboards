/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DataSourceCredentialsProviderOptions,
  AuthenticationMethod,
  ClientParameters,
} from '../types';

export const authRegistryCredentialProvider = async (
  authenticationMethod: AuthenticationMethod,
  options: DataSourceCredentialsProviderOptions
): Promise<ClientParameters> => {
  const clientParameters = await authenticationMethod.credentialProvider(options);
  return clientParameters as ClientParameters;
};
