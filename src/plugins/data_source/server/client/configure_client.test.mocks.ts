/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ClientMock = jest.fn();
jest.doMock('@opensearch-project/opensearch', () => {
  const actual = jest.requireActual('@opensearch-project/opensearch');
  return {
    ...actual,
    Client: ClientMock,
  };
});

export const parseClientOptionsMock = jest.fn();
jest.doMock('./client_config', () => ({
  parseClientOptions: parseClientOptionsMock,
}));

export const authRegistryCredentialProviderMock = jest.fn();
jest.doMock('../util/credential_provider', () => ({
  authRegistryCredentialProvider: authRegistryCredentialProviderMock,
}));
