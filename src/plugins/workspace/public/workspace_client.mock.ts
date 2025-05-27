/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IWorkspaceClient } from 'opensearch-dashboards/public';

export const createMockWorkspaceClient = (): jest.Mocked<
  IWorkspaceClient & { enterWorkspace: (id: string) => Promise<null> }
> => ({
  getCurrentWorkspaceId: jest.fn(),
  getCurrentWorkspace: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  copy: jest.fn(),
  associate: jest.fn(),
  dissociate: jest.fn(),
  ui: jest.fn(),
  enterWorkspace: jest.fn(),
});

export const workspaceClientMock = createMockWorkspaceClient();

export const WorkspaceClientMock = jest.fn(function () {
  return workspaceClientMock;
});

jest.doMock('./workspace_client', () => ({
  WorkspaceClient: WorkspaceClientMock,
}));
