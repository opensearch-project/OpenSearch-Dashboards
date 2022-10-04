/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ClientMock = jest.fn();
jest.doMock('elasticsearch', () => {
  const actual = jest.requireActual('elasticsearch');
  return {
    ...actual,
    Client: ClientMock,
  };
});

export const parseClientOptionsMock = jest.fn();
jest.doMock('./client_config', () => ({
  parseClientOptions: parseClientOptionsMock,
}));
