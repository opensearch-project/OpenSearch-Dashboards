/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './workspace_menu.scss';
import { i18n } from '@osd/i18n';
import React, { useMemo, useRef, useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiAvatar,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenu,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPopover,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { truncate } from 'lodash';
import { Observable } from 'rxjs';
import {
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
  MAX_WORKSPACE_PICKER_NUM,
  MAX_WORKSPACE_NAME_LENGTH,
  WORKSPACE_DETAIL_APP_ID,
  WORKSPACE_USE_CASES,
} from '../../../common/constants';
import { cleanWorkspaceId, formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { CoreStart, NavGroupItemInMap, WorkspaceObject } from '../../../../../core/public';
import { WorkspaceUseCaseId, getUseCaseFromFeatureConfig } from '../../utils';
import { recentWorkspaceManager } from '../../recent_workspace_manager';

const defaultHeaderName = i18n.translate(
  'core.ui.primaryNav.workspacePickerMenu.defaultHeaderName',
  {
    defaultMessage: 'Workspaces',
  }
);
interface Props {
  coreStart: CoreStart;
}

export const WorkspaceMenu = ({ coreStart }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);
  const isDashboardAdmin = !!coreStart.application.capabilities.dashboards;
  const navGroupsMapRef = useRef<Observable<Record<string, NavGroupItemInMap>>>(
    coreStart.chrome.navGroup.getNavGroupsMap$()
  );
  const navGroupsMap = useObservable(navGroupsMapRef.current, undefined);

  const filteredWorkspaceList = useMemo(() => {
    return workspaceList.slice(0, MAX_WORKSPACE_PICKER_NUM);
  }, [workspaceList]);

  const filteredRecentWorkspaces = useMemo(() => {
    return recentWorkspaceManager
      .getRecentWorkspaces()
      .map((workspace) => workspaceList.find((ws) => ws.id === workspace.id))
      .filter((workspace): workspace is WorkspaceObject => workspace !== undefined)
      .slice(0, MAX_WORKSPACE_PICKER_NUM);
  }, [workspaceList]);

  const currentWorkspaceName = currentWorkspace?.name ?? defaultHeaderName;

  const getUseCase = (workspace: WorkspaceObject) => {
    return workspace?.features
      ?.map(getUseCaseFromFeatureConfig)
      .filter(Boolean)[0] as WorkspaceUseCaseId;
  };

  const openPopover = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const workspaceToItem = (workspace: WorkspaceObject, itemType: string) => {
    const appId = navGroupsMap?.[getUseCase(workspace)]?.navLinks[0].id ?? WORKSPACE_DETAIL_APP_ID;
    const useCaseURL = formatUrlWithWorkspaceId(
      coreStart.application.getUrlForApp(appId, {
        absolute: false,
      }),
      workspace.id,
      coreStart.http.basePath
    );

    const workspaceName = truncate(workspace.name, { length: MAX_WORKSPACE_NAME_LENGTH });

    return {
      name: workspaceName,
      key: workspace.id,
      'data-test-subj': `context-menu-item-${itemType}-${workspace.id}`,
      icon: (
        <EuiAvatar
          size="s"
          type="space"
          name={workspaceName}
          color={workspace.color}
          initialsLength={2}
        />
      ),
      onClick: () => {
        window.location.assign(useCaseURL);
      },
    };
  };

  const getWorkspaceListItems = (panelsWorkspaceList: WorkspaceObject[], itemType: string) => {
    const workspaceListItems = panelsWorkspaceList.map((workspace) =>
      workspaceToItem(workspace, itemType)
    );
    return workspaceListItems;
  };

  const currentWorkspaceButton = currentWorkspace ? (
    <EuiButtonEmpty flush="left" onClick={openPopover} data-test-subj="current-workspace-button">
      <EuiAvatar
        size="s"
        type="space"
        name={currentWorkspace.name}
        color={currentWorkspace.color}
        initialsLength={2}
      />
    </EuiButtonEmpty>
  ) : (
    <EuiButtonIcon
      iconType="spacesApp"
      onClick={openPopover}
      aria-label="workspace-select-button"
      data-test-subj="workspace-select-button"
    />
  );

  const allWorkspacesPanels = [
    {
      id: 0,
      title: (
        <span className="custom-title">
          <FormattedMessage
            id="core.ui.primaryNav.contextMenuTitle.allWorkspaces"
            defaultMessage="All workspaces"
          />
        </span>
      ),
      width: 280,
      items: getWorkspaceListItems(filteredWorkspaceList, 'all'),
    },
  ];

  const recentWorkspacesPanels = [
    {
      id: 0,
      title: (
        <span className="custom-title">
          <FormattedMessage
            id="core.ui.primaryNav.contextMenuTitle.recentWorkspaces"
            defaultMessage="Recent workspaces"
          />
        </span>
      ),
      width: 280,
      items: getWorkspaceListItems(filteredRecentWorkspaces, 'recent'),
    },
  ];

  return (
    <EuiPopover
      id="workspaceDropdownMenu"
      display="block"
      button={currentWorkspaceButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downCenter"
    >
      <EuiPanel paddingSize="m" hasBorder={false} color="transparent">
        <EuiFlexGroup justifyContent="center" alignItems="center" direction="column" gutterSize="s">
          {currentWorkspace ? (
            <>
              <EuiFlexItem grow={false}>
                <EuiAvatar
                  size="m"
                  type="space"
                  name={currentWorkspaceName}
                  color={currentWorkspace?.color}
                  initialsLength={2}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="context-menu-current-workspace-name">
                {currentWorkspaceName}
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="context-menu-current-use-case">
                {WORKSPACE_USE_CASES[getUseCase(currentWorkspace)].title ?? ''}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="text"
                  onClick={() => {
                    window.location.assign(
                      formatUrlWithWorkspaceId(
                        coreStart.application.getUrlForApp(WORKSPACE_DETAIL_APP_ID, {
                          absolute: false,
                        }),
                        currentWorkspace.id,
                        coreStart.http.basePath
                      )
                    );
                  }}
                >
                  <FormattedMessage
                    id="core.ui.primaryNav.workspace.manage"
                    defaultMessage="Manage workspace"
                  />
                </EuiButton>
              </EuiFlexItem>
            </>
          ) : (
            <>
              <EuiFlexItem grow={false}>
                <EuiAvatar size="m" color="plain" name="spacesApp" iconType="spacesApp" />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="context-menu-current-workspace-name">
                {currentWorkspaceName}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="text"
                  onClick={() => {
                    window.location.assign(
                      cleanWorkspaceId(
                        coreStart.application.getUrlForApp(WORKSPACE_LIST_APP_ID, {
                          absolute: false,
                        })
                      )
                    );
                  }}
                >
                  <FormattedMessage
                    id="core.ui.primaryNav.workspaces.manage"
                    defaultMessage="Manage workspaces"
                  />
                </EuiButton>
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
      <EuiContextMenu
        initialPanelId={0}
        panels={recentWorkspacesPanels}
        size="s"
        data-test-subj="context-menu-recent-workspaces"
      />
      <EuiContextMenu
        initialPanelId={0}
        panels={allWorkspacesPanels}
        size="s"
        data-test-subj="context-menu-all-workspaces"
      />
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              flush="left"
              key={WORKSPACE_LIST_APP_ID}
              data-test-subj="context-menu-view-all-button"
              onClick={() => {
                window.location.assign(
                  cleanWorkspaceId(
                    coreStart.application.getUrlForApp(WORKSPACE_LIST_APP_ID, {
                      absolute: false,
                    })
                  )
                );
              }}
            >
              <FormattedMessage id="core.ui.primaryNav.allWorkspace" defaultMessage="View all" />
            </EuiButtonEmpty>
          </EuiFlexItem>
          {isDashboardAdmin && (
            <EuiFlexItem grow={false}>
              <EuiButton
                color="text"
                iconType="plus"
                size="s"
                key={WORKSPACE_CREATE_APP_ID}
                data-test-subj="context-menu-create-workspace-button"
                onClick={() => {
                  window.location.assign(
                    coreStart.application.getUrlForApp(WORKSPACE_CREATE_APP_ID, {
                      absolute: false,
                    })
                  );
                }}
              >
                <FormattedMessage
                  id="core.ui.primaryNav.createWorkspace"
                  defaultMessage="Create workspace"
                />
              </EuiButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPopover>
  );
};
