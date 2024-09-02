/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useMemo } from 'react';
import { useObservable } from 'react-use';
import { EuiTitle, EuiAvatar, EuiListGroup, EuiListGroupItem } from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { MAX_WORKSPACE_PICKER_NUM } from '../../../common/constants';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { WorkspaceUseCase } from '../../types';
import { validateWorkspaceColor } from '../../../common/utils';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../../utils';

const allWorkspacesTitle = i18n.translate('workspace.menu.title.allWorkspaces', {
  defaultMessage: 'All workspaces',
});

const recentWorkspacesTitle = i18n.translate('workspace.menu.title.recentWorkspaces', {
  defaultMessage: 'Recent workspaces',
});

const getValidWorkspaceColor = (color?: string) =>
  validateWorkspaceColor(color) ? color : undefined;

interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  onClickWorkspace?: () => void;
}

export const WorkspacePickerContent = ({
  coreStart,
  registeredUseCases$,
  onClickWorkspace,
}: Props) => {
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);
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

  const getUseCase = (workspace: WorkspaceObject) => {
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const getWorkspaceListGroup = (filterWorkspaceList: WorkspaceObject[], itemType: string) => {
    const listItems = filterWorkspaceList.map((workspace: WorkspaceObject) => {
      const useCase = getUseCase(workspace);
      const useCaseURL = getUseCaseUrl(useCase, workspace, coreStart.application, coreStart.http);
      return (
        <EuiListGroupItem
          key={workspace.id}
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
            onClickWorkspace?.();
            window.location.assign(useCaseURL);
          }}
        />
      );
    });
    return (
      <EuiListGroup showToolTips flush gutterSize="none" wrapText maxWidth={240}>
        <EuiListGroupItem
          label={
            <EuiTitle size="xxs">
              <h4>{itemType === 'all' ? allWorkspacesTitle : recentWorkspacesTitle}</h4>
            </EuiTitle>
          }
        />
        {listItems}
      </EuiListGroup>
    );
  };

  return (
    <>
      {filteredRecentWorkspaces.length > 0 &&
        getWorkspaceListGroup(filteredRecentWorkspaces, 'recent')}
      {filteredWorkspaceList.length > 0 && getWorkspaceListGroup(filteredWorkspaceList, 'all')}
    </>
  );
};
