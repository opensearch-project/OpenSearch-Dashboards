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
import { ALL_USE_CASE_ID, CoreStart, WorkspaceObject } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { WorkspaceUseCase } from '../../types';
import { navigateToWorkspaceDetail } from '../utils/workspace';
import { validateWorkspaceColor } from '../../../common/utils';

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

const getValidWorkspaceColor = (color?: string) =>
  validateWorkspaceColor(color) ? color : undefined;

interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceMenu = ({ coreStart, registeredUseCases$ }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const currentWorkspace = useObservable(coreStart.workspaces.currentWorkspace$, null);
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;
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
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const openPopover = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const currentWorkspaceButton = currentWorkspace ? (
    <EuiButtonEmpty onClick={openPopover} data-test-subj="current-workspace-button">
      <EuiAvatar
        size="s"
        type="space"
        name={currentWorkspace.name}
        color={getValidWorkspaceColor(currentWorkspace.color)}
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
      const useCase = getUseCase(workspace);
      const appId =
        (useCase?.id !== ALL_USE_CASE_ID && useCase?.features?.[0]) || WORKSPACE_DETAIL_APP_ID;
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
          className="eui-textTruncate"
          size="s"
          data-test-subj={`workspace-menu-item-${itemType}-${workspace.id}`}
          icon={
            <EuiAvatar
              size="s"
              type="space"
              name={workspace.name}
              color={getValidWorkspaceColor(workspace.color)}
              initialsLength={2}
            />
          }
          label={workspace.name}
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
        <EuiListGroup showToolTips flush gutterSize="none" wrapText maxWidth={240}>
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
                  color={getValidWorkspaceColor(currentWorkspace?.color)}
                  initialsLength={2}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-workspace-name">
                <EuiToolTip
                  anchorClassName="eui-textTruncate"
                  position="right"
                  content={currentWorkspaceName}
                >
                  <EuiText size="s" style={{ maxWidth: '195px' }} className="eui-textTruncate">
                    {currentWorkspaceName}
                  </EuiText>
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem grow={false} data-test-subj="workspace-menu-current-use-case">
                <EuiText size="s">{getUseCase(currentWorkspace)?.title ?? ''}</EuiText>
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
