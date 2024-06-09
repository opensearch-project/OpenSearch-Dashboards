/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiButtonIcon,
  EuiCollapsibleNavGroup,
  EuiContextMenu,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import type { EuiContextMenuPanelItemDescriptor } from '@elastic/eui';

import { CollapsibleNavHeaderRenderProps } from 'src/core/public';
import {
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
  WORKSPACE_OVERVIEW_APP_ID,
  WORKSPACE_USE_CASES,
} from '../../../common/constants';
import { cleanWorkspaceId, formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getUseCaseFromFeatureConfig } from '../../utils';

interface Props extends CollapsibleNavHeaderRenderProps {
  coreStart: CoreStart;
}

/**
 * Return maximum five workspaces, the current selected workspace
 * will be on the top of the list.
 */
function getFilteredWorkspaceList(
  workspaceList: WorkspaceObject[],
  currentWorkspace: WorkspaceObject | null
): WorkspaceObject[] {
  return [
    ...(currentWorkspace ? [currentWorkspace] : []),
    ...workspaceList.filter((workspace) => workspace.id !== currentWorkspace?.id),
  ].slice(0, 5);
}

export const WorkspaceMenu = ({ coreStart, setFocusGroup }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);
  const selectedUseCase =
    currentWorkspace?.features
      ?.map((item) => getUseCaseFromFeatureConfig(item))
      .filter((item) => item) || [];

  const defaultHeaderName = i18n.translate(
    'core.ui.primaryNav.workspacePickerMenu.defaultHeaderName',
    {
      defaultMessage: 'Select a workspace',
    }
  );
  const filteredWorkspaceList = getFilteredWorkspaceList(workspaceList, currentWorkspace);
  const currentWorkspaceName = currentWorkspace?.name ?? defaultHeaderName;

  const openPopover = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const workspaceToItem = (workspace: WorkspaceObject) => {
    const workspaceURL = formatUrlWithWorkspaceId(
      coreStart.application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
        absolute: false,
      }),
      workspace.id,
      coreStart.http.basePath
    );
    const name =
      currentWorkspace?.name === workspace.name ? (
        <EuiText>
          <strong>{workspace.name}</strong>
        </EuiText>
      ) : (
        workspace.name
      );
    return {
      name,
      key: workspace.id,
      icon: <EuiIcon type="stopFilled" color={workspace.color ?? 'primary'} />,
      onClick: () => {
        window.location.assign(workspaceURL);
      },
    };
  };

  const getWorkspaceListItems = () => {
    const workspaceListItems: EuiContextMenuPanelItemDescriptor[] = filteredWorkspaceList.map(
      workspaceToItem
    );
    workspaceListItems.push({
      icon: <EuiIcon type="plus" />,
      name: i18n.translate('core.ui.primaryNav.workspaceContextMenu.createWorkspace', {
        defaultMessage: 'Create workspace',
      }),
      key: WORKSPACE_CREATE_APP_ID,
      onClick: () => {
        window.location.assign(
          cleanWorkspaceId(
            coreStart.application.getUrlForApp(WORKSPACE_CREATE_APP_ID, {
              absolute: false,
            })
          )
        );
      },
    });
    workspaceListItems.push({
      icon: <EuiIcon type="folderClosed" />,
      name: i18n.translate('core.ui.primaryNav.workspaceContextMenu.allWorkspace', {
        defaultMessage: 'All workspaces',
      }),
      key: WORKSPACE_LIST_APP_ID,
      onClick: () => {
        window.location.assign(
          cleanWorkspaceId(
            coreStart.application.getUrlForApp(WORKSPACE_LIST_APP_ID, {
              absolute: false,
            })
          )
        );
      },
    });
    return workspaceListItems;
  };

  const currentWorkspaceButton = (
    <EuiListGroupItem
      iconType="spacesApp"
      label={currentWorkspaceName}
      onClick={openPopover}
      extraAction={{
        color: 'subdued',
        onClick: openPopover,
        iconType: 'arrowDown',
        iconSize: 's',
        'aria-label': 'Show workspace dropdown selector',
      }}
    />
  );

  const currentWorkspaceTitle = (
    <EuiFlexGroup alignItems="center">
      <EuiFlexItem grow={true}>
        <EuiText size="s">{currentWorkspaceName}</EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType="cross"
          onClick={closePopover}
          aria-label="close workspace dropdown"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const panels = [
    {
      id: 0,
      title: currentWorkspaceTitle,
      items: getWorkspaceListItems(),
    },
  ];

  return (
    <EuiListGroup>
      <EuiPopover
        id="workspaceDropdownMenu"
        display="block"
        button={currentWorkspaceButton}
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize="none"
        anchorPosition="downCenter"
      >
        <EuiContextMenu initialPanelId={0} panels={panels} />
      </EuiPopover>
      {selectedUseCase.map((useCase) => {
        const useCaseDescription = WORKSPACE_USE_CASES[useCase];
        return (
          <EuiListGroupItem
            color="text"
            size="s"
            key={useCase}
            title={useCaseDescription.title}
            label={useCaseDescription.title}
            onClick={() => {
              setFocusGroup(useCase);
            }}
          />
        );
      })}
    </EuiListGroup>
  );
};
