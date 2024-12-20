/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiText, EuiBadge, EuiPopover } from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { i18n } from '@osd/i18n';
import { WorkspaceAttribute, CoreSetup } from '../../../../../core/public';
import { SavedObjectsManagementColumn } from '../../../../saved_objects_management/public';

interface WorkspaceColumnProps {
  coreSetup: CoreSetup;
  workspaces?: string[];
}

export function WorkspaceColumn({ coreSetup, workspaces }: WorkspaceColumnProps) {
  const workspaceList = useObservable(coreSetup.workspaces.workspaceList$);
  const [showBadgePopover, setShowBadgePopover] = useState(false);
  const wsLookUp = workspaceList?.reduce((map, ws) => {
    return map.set(ws.id, ws.name);
  }, new Map<string, string>());

  const workspaceNames = workspaces?.map((wsId) => wsLookUp?.get(wsId)).filter((ws) => ws);

  const toggleBadgePopover = () => {
    setShowBadgePopover(!showBadgePopover);
  };

  const closeBadgePopover = () => {
    setShowBadgePopover(false);
  };

  if (workspaceNames?.length) {
    const displayedWorkspaces = workspaceNames.slice(0, 1);
    const remainingWorkspacesCount = workspaceNames.length - 1;
    return (
      <>
        <EuiText size="s">{displayedWorkspaces}</EuiText>
        {remainingWorkspacesCount > 0 && (
          <>
            &nbsp;&nbsp;
            <EuiBadge
              color="hollow"
              iconType="popout"
              iconSide="right"
              onClick={toggleBadgePopover}
              iconOnClick={toggleBadgePopover}
              iconOnClickAriaLabel="Open workspaces popover"
              onClickAriaLabel="Open workspaces popover"
              data-test-subj="workspace-column-more-workspaces-badge"
            >
              + {remainingWorkspacesCount} more
            </EuiBadge>
            {showBadgePopover && (
              <EuiPopover
                isOpen={showBadgePopover}
                closePopover={closeBadgePopover}
                anchorPosition="rightCenter"
                panelPaddingSize="s"
                data-test-subj="workspace-column-popover"
              >
                {workspaceNames.slice(1).map((ws) => (
                  <EuiText key={ws} size="xs">
                    {ws}
                  </EuiText>
                ))}
              </EuiPopover>
            )}
          </>
        )}
      </>
    );
  } else {
    return <EuiText size="s">&mdash;</EuiText>;
  }
}
export function getWorkspaceColumn(
  coreSetup: CoreSetup
): SavedObjectsManagementColumn<WorkspaceAttribute | undefined> {
  return {
    id: 'workspace_column',
    euiColumn: {
      align: 'left',
      field: 'workspaces',
      name: i18n.translate('workspace.objectsTable.table.columnWorkspacesName', {
        defaultMessage: 'Workspace',
      }),
      render: (workspaces: string[]) => {
        return <WorkspaceColumn coreSetup={coreSetup} workspaces={workspaces} />;
      },
    },
    loadData: () => {
      return Promise.resolve(undefined);
    },
  };
}
