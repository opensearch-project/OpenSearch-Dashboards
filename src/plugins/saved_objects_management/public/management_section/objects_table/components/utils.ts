/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBoxOptionOption } from '@elastic/eui';
import { WorkspaceAttribute, WorkspacesStart } from 'opensearch-dashboards/public';

export type WorkspaceOption = EuiComboBoxOptionOption<WorkspaceAttribute>;

// Convert workspace to option which can be displayed in the drop-down box.
export function workspaceToOption(
  workspace: WorkspaceAttribute,
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
  currentWorkspaceId?: string
): WorkspaceOption[] {
  const workspaceList = workspaces.workspaceList$.value;
  const targetWorkspaces = workspaceList.filter(
    (workspace) => workspace.id !== currentWorkspaceId && !workspace.libraryReadonly
  );
  return targetWorkspaces.map((workspace) => workspaceToOption(workspace, currentWorkspaceId));
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
