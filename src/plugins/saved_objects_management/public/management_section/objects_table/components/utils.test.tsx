/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceAttribute, WorkspaceObject, WorkspacesStart } from 'opensearch-dashboards/public';
import {
  WorkspaceOption,
  capitalizeFirstLetter,
  getTargetWorkspacesOptions,
  workspaceToOption,
} from './utils';
import { BehaviorSubject } from 'rxjs';

describe('duplicate mode utils', () => {
  it('should covert workspace to option', () => {
    const workspace: WorkspaceAttribute = {
      id: '1',
      name: 'Workspace 1',
    };
    const workspaceOption: WorkspaceOption = workspaceToOption(workspace);
    expect(workspaceOption.label).toBe(workspace.name);
    expect(workspaceOption.key).toBe(workspace.id);
    expect(workspaceOption.value).toBe(workspace);
  });

  it('should add suffix when workspace is current workspace', () => {
    const workspace: WorkspaceAttribute = {
      id: '1',
      name: 'Workspace 1',
    };
    const workspaceOption: WorkspaceOption = workspaceToOption(workspace, '1');
    expect(workspaceOption.label).toBe('Workspace 1 (current)');
    expect(workspaceOption.key).toBe(workspace.id);
    expect(workspaceOption.value).toBe(workspace);
  });

  it('should get target workspace options', () => {
    const workspaces: WorkspacesStart = {
      currentWorkspaceId$: new BehaviorSubject<string>('1'),
      currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>({
        id: '1',
        name: 'Workspace 1',
      }),
      workspaceList$: new BehaviorSubject<WorkspaceObject[]>([
        { id: '1', name: 'Workspace 1' },
        { id: '2', name: 'Workspace 2', libraryReadonly: false },
        { id: '3', name: 'Workspace 3', libraryReadonly: true },
      ]),
      initialized$: new BehaviorSubject<boolean>(true),
    };
    const optionContainCurrent: WorkspaceOption[] = getTargetWorkspacesOptions(workspaces, '1');
    expect(optionContainCurrent.length).toBe(1);
    expect(optionContainCurrent[0].key).toBe('2');
    expect(optionContainCurrent[0].label).toBe('Workspace 2');

    const workspaceOption: WorkspaceOption[] = getTargetWorkspacesOptions(workspaces);
    expect(workspaceOption.length).toBe(2);
  });

  it('should capitalize first letter', () => {
    const workspaceName: string = 'workspace';
    const capitalizedName: string = capitalizeFirstLetter(workspaceName);
    expect(capitalizedName).toBe('Workspace');
  });
});
