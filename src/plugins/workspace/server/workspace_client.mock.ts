/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const workspaceClientMock = {
  create: () => ({
    setup: jest.fn(),
    setSavedObjects: jest.fn(),
    setUiSettings: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: 'mock-workspace-id' }),
    list: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    destroy: jest.fn(),
  }),
};
