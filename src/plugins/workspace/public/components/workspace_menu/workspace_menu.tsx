/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiCollapsibleNavGroup,
  EuiContextMenu,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import type { EuiContextMenuPanelItemDescriptor } from '@elastic/eui';

import {
  ApplicationStart,
  HttpSetup,
  MANAGEMENT_WORKSPACE_ID,
  WorkspaceAttribute,
  WorkspacesStart,
} from '../../../../../core/public';
import {
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
  WORKSPACE_OVERVIEW_APP_ID,
} from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { cleanWorkspaceId } from '../../../../../core/public';

interface Props {
  getUrlForApp: ApplicationStart['getUrlForApp'];
  navigateToUrl: ApplicationStart['navigateToUrl'];
  basePath: HttpSetup['basePath'];
  workspaces: WorkspacesStart;
}

function getFilteredWorkspaceList(
  workspaceList: WorkspaceAttribute[],
  currentWorkspace: WorkspaceAttribute | null
): WorkspaceAttribute[] {
  // list top5 workspaces except management workspace, place current workspace at the top
  return [
    ...(currentWorkspace ? [currentWorkspace] : []),
    ...workspaceList.filter(
      (workspace) =>
        workspace.id !== MANAGEMENT_WORKSPACE_ID && workspace.id !== currentWorkspace?.id
    ),
  ].slice(0, 5);
}

export const WorkspaceMenu = ({ basePath, getUrlForApp, workspaces, navigateToUrl }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(workspaces.currentWorkspace$, null);
  const workspaceList = useObservable(workspaces.workspaceList$, []);

  const defaultHeaderName = i18n.translate(
    'core.ui.primaryNav.workspacePickerMenu.defaultHeaderName',
    {
      defaultMessage: 'OpenSearch Dashboards',
    }
  );
  const managementWorkspaceName = i18n.translate(
    'core.ui.primaryNav.workspacePickerMenu.managementWorkspaceName',
    {
      defaultMessage: 'Management',
    }
  );
  const filteredWorkspaceList = getFilteredWorkspaceList(workspaceList, currentWorkspace);
  const currentWorkspaceName = currentWorkspace?.name ?? defaultHeaderName;

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const workspaceToItem = (workspace: WorkspaceAttribute, index: number) => {
    const href = formatUrlWithWorkspaceId(
      getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
        absolute: false,
      }),
      workspace.id,
      basePath
    );
    const name =
      currentWorkspace !== null && index === 0 ? (
        <EuiText>
          <strong> {workspace.name} </strong>
        </EuiText>
      ) : (
        workspace.name
      );
    return {
      href,
      name,
      key: index.toString(),
      icon: <EuiIcon type="stopFilled" color={workspace.color ?? 'primary'} />,
    };
  };

  const getWorkspaceListItems = () => {
    const workspaceListItems: EuiContextMenuPanelItemDescriptor[] = filteredWorkspaceList.map(
      (workspace, index) => workspaceToItem(workspace, index)
    );
    const length = workspaceListItems.length;
    workspaceListItems.push({
      icon: <EuiIcon type="plus" />,
      name: i18n.translate('core.ui.primaryNav.workspaceContextMenu.createWorkspace', {
        defaultMessage: 'Create workspace',
      }),
      key: length.toString(),
      onClick: () => {
        navigateToUrl(
          cleanWorkspaceId(
            getUrlForApp(WORKSPACE_CREATE_APP_ID, {
              absolute: false,
            })
          )
        );
        setPopover(false);
      },
    });
    workspaceListItems.push({
      icon: <EuiIcon type="folderClosed" />,
      name: i18n.translate('core.ui.primaryNav.workspaceContextMenu.allWorkspace', {
        defaultMessage: 'All workspaces',
      }),
      key: (length + 1).toString(),
      onClick: () => {
        navigateToUrl(
          cleanWorkspaceId(
            getUrlForApp(WORKSPACE_LIST_APP_ID, {
              absolute: false,
            })
          )
        );
        setPopover(false);
      },
    });
    return workspaceListItems;
  };

  const currentWorkspaceButton = (
    <EuiCollapsibleNavGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiIcon type="logoOpenSearch" size="l" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <strong> {currentWorkspaceName} </strong>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiIcon type="arrowDown" onClick={onButtonClick} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCollapsibleNavGroup>
  );

  const currentWorkspaceTitle = (
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiIcon type="logoOpenSearch" size="l" />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiText>
          <strong> {currentWorkspaceName} </strong>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiIcon type="cross" onClick={closePopover} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const panels = [
    {
      id: 0,
      title: currentWorkspaceTitle,
      items: [
        {
          name: (
            <EuiText>
              <strong>
                {i18n.translate('core.ui.primaryNav.workspacePickerMenu.workspaceList', {
                  defaultMessage: 'Workspaces',
                })}
              </strong>
            </EuiText>
          ),
          icon: 'folderClosed',
          panel: 1,
        },
        {
          name: managementWorkspaceName,
          icon: 'managementApp',
          href: formatUrlWithWorkspaceId(
            getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
              absolute: false,
            }),
            MANAGEMENT_WORKSPACE_ID,
            basePath
          ),
        },
      ],
    },
    {
      id: 1,
      title: 'Workspaces',
      items: getWorkspaceListItems(),
    },
  ];

  return (
    <EuiPopover
      id="contextMenuExample"
      button={currentWorkspaceButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
