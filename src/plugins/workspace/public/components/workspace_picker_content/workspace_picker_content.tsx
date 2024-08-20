/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useMemo } from 'react';
import { useObservable } from 'react-use';
import {
  EuiTitle,
  EuiAvatar,
  EuiSpacer,
  EuiText,
  EuiListGroup,
  EuiListGroupItem,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
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
  searchQuery: string;
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  onClickWorkspace?: () => void;
}

export const WorkspacePickerContent = ({
  searchQuery,
  coreStart,
  registeredUseCases$,
  onClickWorkspace,
}: Props) => {
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;
  const availableUseCases = useObservable(registeredUseCases$, []);

  const filteredRecentWorkspaces = useMemo(() => {
    return recentWorkspaceManager
      .getRecentWorkspaces()
      .map((workspace) => workspaceList.find((ws) => ws.id === workspace.id))
      .filter((workspace): workspace is WorkspaceObject => workspace !== undefined);
  }, [workspaceList]);

  const queryedWorkspace = useMemo(() => {
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      const result = workspaceList.filter((item) => {
        return item.name.toLowerCase().indexOf(normalizedQuery) > -1;
      });
      return result;
    }
    return workspaceList;
  }, [workspaceList, searchQuery]);

  const queryedRecentWorkspace = useMemo(() => {
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      const result = filteredRecentWorkspaces.filter((item) => {
        return item.name.toLowerCase().indexOf(normalizedQuery) > -1;
      });
      return result;
    }
    return workspaceList;
  }, [filteredRecentWorkspaces, searchQuery, workspaceList]);

  const getUseCase = (workspace: WorkspaceObject) => {
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const getEmptyStatePrompt = () => {
    return (
      <EuiEmptyPrompt
        style={{ width: '250px' }}
        iconType="spacesApp"
        title={
          <EuiText size="m">
            <p>No workspace available</p>
          </EuiText>
        }
        body={
          <EuiText size="s">
            <p>
              {isDashboardAdmin
                ? 'Create a workspace to get start'
                : 'Contact your administrator to create a workspace or to be added to an existing one'}
            </p>
          </EuiText>
        }
      />
    );
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
      {searchQuery ? (
        queryedWorkspace && queryedWorkspace.length > 0 ? (
          <>
            {getWorkspaceListGroup(queryedRecentWorkspace, 'recent')}
            <EuiSpacer />
            {getWorkspaceListGroup(queryedWorkspace, 'all')}
          </>
        ) : (
          getEmptyStatePrompt()
        )
      ) : (
        <>
          {filteredRecentWorkspaces.length > 0 &&
            getWorkspaceListGroup(filteredRecentWorkspaces, 'recent')}
          <EuiSpacer />
          {workspaceList.length > 0 && getWorkspaceListGroup(workspaceList, 'all')}
          {workspaceList.length === 0 && (
            <>
              <EuiSpacer />
              {getEmptyStatePrompt()}
            </>
          )}
        </>
      )}
    </>
  );
};
