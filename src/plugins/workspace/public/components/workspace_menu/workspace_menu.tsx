/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiText,
  EuiPanel,
  EuiTitle,
  EuiAvatar,
  EuiButton,
  EuiPopover,
  EuiToolTip,
  EuiFlexItem,
  EuiFlexGroup,
  EuiListGroup,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiListGroupItem,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import {
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
  MAX_WORKSPACE_PICKER_NUM,
  WORKSPACE_DETAIL_APP_ID,
} from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { WorkspaceUseCase } from '../../types';
import { navigateToWorkspaceDetail } from '../utils/workspace';

const defaultHeaderName = i18n.translate('workspace.menu.defaultHeaderName', {
  defaultMessage: 'Workspaces',
});

const allWorkspacesTitle = i18n.translate('workspace.menu.title.allWorkspaces', {
  defaultMessage: 'All workspaces',
});

const recentWorkspacesTitle = i18n.translate('workspace.menu.title.recentWorkspaces', {
  defaultMessage: 'Recent workspaces',
});

const createWorkspaceButton = i18n.translate('workspace.menu.button.createWorkspace', {
  defaultMessage: 'Create workspace',
});

const viewAllButton = i18n.translate('workspace.menu.button.viewAll', {
  defaultMessage: 'View all',
});

const manageWorkspaceButton = i18n.translate('workspace.menu.button.manageWorkspace', {
  defaultMessage: 'Manage workspace',
});

const manageWorkspacesButton = i18n.translate('workspace.menu.button.manageWorkspaces', {
  defaultMessage: 'Manage workspaces',
});

interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceMenu = ({ coreStart, registeredUseCases$ }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);
  const isDashboardAdmin = !!coreStart.application.capabilities.dashboards;
  const availableUseCases = useObservable(registeredUseCases$, []);

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
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace?.features!);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const openPopover = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
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

  const getWorkspaceListGroup = (filterWorkspaceList: WorkspaceObject[], itemType: string) => {
    const listItems = filterWorkspaceList.map((workspace: WorkspaceObject) => {
      const appId = getUseCase(workspace)?.features[0] ?? WORKSPACE_DETAIL_APP_ID;
      const useCaseURL = formatUrlWithWorkspaceId(
        coreStart.application.getUrlForApp(appId, {
          absolute: false,
        }),
        workspace.id,
        coreStart.http.basePath
      );
      return (
        <EuiListGroupItem
          key={workspace.id}
          style={{ paddingLeft: '0' }}
          size="s"
          data-test-subj={`workspace-menu-item-${itemType}-${workspace.id}`}
          icon={
            <EuiAvatar
              size="s"
              type="space"
              name={workspace.name}
              color={workspace.color}
              initialsLength={2}
            />
          }
          label={
            <EuiToolTip
              anchorClassName="eui-textTruncate"
              position="bottom"
              content={workspace.name}
            >
              <EuiText style={{ maxWidth: '220px' }} className="eui-textTruncate">
                {workspace.name}
              </EuiText>
            </EuiToolTip>
          }
          onClick={() => {
            closePopover();
            window.location.assign(useCaseURL);
          }}
        />
      );
    });
    return (
      <>
        <EuiTitle size="xxs">
          <h4>{itemType === 'all' ? allWorkspacesTitle : recentWorkspacesTitle}</h4>
        </EuiTitle>
        <EuiListGroup flush gutterSize="none" maxWidth={280}>
          {listItems}
        </EuiListGroup>
      </>
    );
  };

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
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiFlexGroup
          justifyContent="spaceAround"
          alignItems="center"
          direction="column"
          gutterSize="s"
        >
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
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                <EuiToolTip
                  anchorClassName="eui-textTruncate"
                  position="bottom"
                  content={currentWorkspaceName}
                >
                  <EuiText style={{ maxWidth: '220px' }} className="eui-textTruncate">
                    {currentWorkspaceName}
                  </EuiText>
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-use-case">
                {getUseCase(currentWorkspace)?.title ?? ''}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="text"
                  onClick={() => {
                    closePopover();
                    navigateToWorkspaceDetail(coreStart, currentWorkspace.id);
                  }}
                >
                  {manageWorkspaceButton}
                </EuiButton>
              </EuiFlexItem>
            </>
          ) : (
            <>
              <EuiFlexItem grow={false}>
                <EuiAvatar size="m" color="plain" name="spacesApp" iconType="spacesApp" />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                {currentWorkspaceName}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="text"
                  onClick={() => {
                    closePopover();
                    coreStart.application.navigateToApp(WORKSPACE_LIST_APP_ID);
                  }}
                >
                  {manageWorkspacesButton}
                </EuiButton>
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        {filteredRecentWorkspaces.length > 0 &&
          getWorkspaceListGroup(filteredRecentWorkspaces, 'recent')}
        {filteredWorkspaceList.length > 0 && getWorkspaceListGroup(filteredWorkspaceList, 'all')}
      </EuiPanel>
      <EuiPanel paddingSize="s" hasBorder={false} color="transparent">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              flush="left"
              key={WORKSPACE_LIST_APP_ID}
              data-test-subj="workspace-menu-view-all-button"
              onClick={() => {
                closePopover();
                coreStart.application.navigateToApp(WORKSPACE_LIST_APP_ID);
              }}
            >
              {viewAllButton}
            </EuiButtonEmpty>
          </EuiFlexItem>
          {isDashboardAdmin && (
            <EuiFlexItem grow={false}>
              <EuiButton
                color="text"
                iconType="plus"
                size="s"
                key={WORKSPACE_CREATE_APP_ID}
                data-test-subj="workspace-menu-create-workspace-button"
                onClick={() => {
                  closePopover();
                  coreStart.application.navigateToApp(WORKSPACE_CREATE_APP_ID);
                }}
              >
                {createWorkspaceButton}
              </EuiButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPopover>
  );
};
