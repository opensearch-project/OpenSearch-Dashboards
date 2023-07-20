/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { WorkspaceAttribute } from '../workspace';

const currentWorkspaceId$ = new BehaviorSubject<string>('');
const workspaceList$ = new BehaviorSubject<WorkspaceAttribute[]>([]);
const currentWorkspace$ = new BehaviorSubject<WorkspaceAttribute | null>(null);

const createWorkspacesSetupContractMock = () => ({
  client: {
    currentWorkspaceId$,
    workspaceList$,
    currentWorkspace$,
    init: jest.fn(),
    stop: jest.fn(),
    enterWorkspace: jest.fn(),
    exitWorkspace: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
    getCurrentWorkspace: jest.fn(),
    getCurrentWorkspaceId: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  },
  formatUrlWithWorkspaceId: jest.fn(),
  setFormatUrlWithWorkspaceId: jest.fn(),
});

const createWorkspacesStartContractMock = createWorkspacesSetupContractMock;

export const workspacesServiceMock = {
  createSetupContractMock: createWorkspacesStartContractMock,
  createStartContract: createWorkspacesStartContractMock,
};
