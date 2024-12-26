/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IWorkspaceClient } from './types';
import { WorkspacesService, WorkspacesSetup, WorkspacesStart } from './workspaces_service';

describe('WorkspacesService', () => {
  let workspaces: WorkspacesService;
  let workspacesStart: WorkspacesStart;
  let workspacesSetUp: WorkspacesSetup;

  beforeEach(() => {
    workspaces = new WorkspacesService();
    workspacesSetUp = workspaces.setup();
    workspacesStart = workspaces.start();
  });

  afterEach(() => {
    workspaces.stop();
  });

  it('workspace initialized$ state is false by default', () => {
    expect(workspacesStart.initialized$.value).toBe(false);
  });

  it('currentWorkspace is not set by default', () => {
    expect(workspacesStart.currentWorkspace$.value).toBe(null);
    expect(workspacesStart.currentWorkspaceId$.value).toBe('');
  });

  it('workspaceList$ is empty by default', () => {
    expect(workspacesStart.workspaceList$.value.length).toBe(0);
  });

  it('client$ is not set by default', () => {
    expect(workspacesStart.client$.value).toBe(null);
  });

  it('client is updated when set client', () => {
    const client: IWorkspaceClient = {
      copy: jest.fn(),
      associate: jest.fn(),
      dissociate: jest.fn(),
      ui: jest.fn(),
      list: jest.fn(),
      get: jest.fn(),
      getCurrentWorkspace: jest.fn(),
      getCurrentWorkspaceId: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };
    workspacesSetUp.setClient(client);
    expect(workspacesStart.client$.value).toEqual(client);
  });

  it('currentWorkspace is updated when currentWorkspaceId changes', () => {
    expect(workspacesStart.currentWorkspace$.value).toBe(null);

    workspacesStart.initialized$.next(true);
    workspacesStart.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);
    workspacesStart.currentWorkspaceId$.next('workspace-1');

    expect(workspacesStart.currentWorkspace$.value).toEqual({
      id: 'workspace-1',
      name: 'workspace 1',
    });

    workspacesStart.currentWorkspaceId$.next('');
    expect(workspacesStart.currentWorkspace$.value).toEqual(null);
  });

  it('should return error if the specified workspace id cannot be found', () => {
    expect(workspacesStart.currentWorkspace$.hasError).toBe(false);
    workspacesStart.initialized$.next(true);
    workspacesStart.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);
    workspacesStart.currentWorkspaceId$.next('workspace-3');
    expect(workspacesStart.currentWorkspace$.hasError).toBe(true);
  });

  it('should stop all observables when workspace service stopped', () => {
    workspaces.stop();
    expect(workspacesStart.currentWorkspaceId$.isStopped).toBe(true);
    expect(workspacesStart.currentWorkspace$.isStopped).toBe(true);
    expect(workspacesStart.workspaceList$.isStopped).toBe(true);
    expect(workspacesStart.initialized$.isStopped).toBe(true);
  });
});
