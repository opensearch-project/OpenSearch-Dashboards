/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ClientMock = jest.fn();
jest.doMock('@opensearch-project/opensearch-next', () => {
  const actual = jest.requireActual('@opensearch-project/opensearch-next');
  return {
    ...actual,
    Client: ClientMock,
  };
});

export const parseClientOptionsMock = jest.fn();
jest.doMock('./client_config', () => ({
  parseClientOptions: parseClientOptionsMock,
}));
