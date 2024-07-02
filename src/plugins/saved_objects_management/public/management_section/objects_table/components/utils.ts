/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBoxOptionOption } from '@elastic/eui';
import { WorkspaceObject, WorkspacesStart } from 'opensearch-dashboards/public';

export type WorkspaceOption = EuiComboBoxOptionOption<WorkspaceObject>;

// Convert workspace to option which can be displayed in the drop-down box.
export function workspaceToOption(
  workspace: WorkspaceObject,
  currentWorkspaceId?: string
): WorkspaceOption {
  // add (current) after current workspace name
  let workspaceName = workspace.name;
  if (workspace.id === currentWorkspaceId) {
    workspaceName += ' (current)';
  }
  return {
    label: workspaceName,
    key: workspace.id,
    value: workspace,
  };
}

export function getTargetWorkspacesOptions(
  workspaces: WorkspacesStart,
  currentWorkspace?: WorkspaceObject
): WorkspaceOption[] {
  const currentWorkspaceId = currentWorkspace?.id;
  const workspaceList = workspaces.workspaceList$.value;
  const targetWorkspaces = workspaceList.filter(
    (workspace) => workspace.id !== currentWorkspaceId && !workspace.readonly
  );
  // current workspace is the first option
  if (currentWorkspace && !currentWorkspace.readonly) targetWorkspaces.unshift(currentWorkspace);
  return targetWorkspaces.map((workspace) => workspaceToOption(workspace, currentWorkspaceId));
}
