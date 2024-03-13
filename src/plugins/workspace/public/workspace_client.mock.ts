/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const workspaceClientMock = {
  init: jest.fn(),
  enterWorkspace: jest.fn(),
  getCurrentWorkspaceId: jest.fn(),
  getCurrentWorkspace: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  stop: jest.fn(),
};

export const WorkspaceClientMock = jest.fn(function () {
  return workspaceClientMock;
});

jest.doMock('./workspace_client', () => ({
  WorkspaceClient: WorkspaceClientMock,
}));
