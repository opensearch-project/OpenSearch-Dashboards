/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { WorkspaceAttribute } from '..';

const currentWorkspaceId$ = new BehaviorSubject<string>('');
const workspaceList$ = new BehaviorSubject<WorkspaceAttribute[]>([]);
const currentWorkspace$ = new BehaviorSubject<WorkspaceAttribute | null>(null);
const hasFetchedWorkspaceList$ = new BehaviorSubject<boolean>(false);
const workspaceEnabled$ = new BehaviorSubject<boolean>(false);

const createWorkspacesSetupContractMock = () => ({
  currentWorkspaceId$,
  workspaceList$,
  currentWorkspace$,
  hasFetchedWorkspaceList$,
  workspaceEnabled$,
  registerWorkspaceMenuRender: jest.fn(),
});

const createWorkspacesStartContractMock = () => ({
  currentWorkspaceId$,
  workspaceList$,
  currentWorkspace$,
  hasFetchedWorkspaceList$,
  workspaceEnabled$,
  renderWorkspaceMenu: jest.fn(),
});

export const workspacesServiceMock = {
  createSetupContractMock: createWorkspacesSetupContractMock,
  createStartContract: createWorkspacesStartContractMock,
};
