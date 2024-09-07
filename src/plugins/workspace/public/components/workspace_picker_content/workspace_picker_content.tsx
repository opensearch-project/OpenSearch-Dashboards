/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiTitle,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiFieldSearch,
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

const searchFieldPlaceholder = i18n.translate('workspace.menu.search.placeholder', {
  defaultMessage: 'Search workspace name',
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
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;
  const availableUseCases = useObservable(registeredUseCases$, []);
  const [search, setSearch] = useState('');

  const recentWorkspaces = useMemo(() => {
    return recentWorkspaceManager
      .getRecentWorkspaces()
      .map((workspace) => workspaceList.find((ws) => ws.id === workspace.id))
      .filter((workspace): workspace is WorkspaceObject => workspace !== undefined);
  }, [workspaceList]);

  const queryFromList = ({ list, query }: { list: WorkspaceObject[]; query: string }) => {
    if (!list || list.length === 0) {
      return [];
    }

    if (query && query.trim() !== '') {
      const normalizedQuery = query.toLowerCase();
      const result = list.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
      return result;
    }

    return list;
  };

  const queriedWorkspace = useMemo(() => {
    return queryFromList({ list: workspaceList, query: search });
  }, [workspaceList, search]);

  const queriedRecentWorkspace = useMemo(() => {
    return queryFromList({ list: recentWorkspaces, query: search });
  }, [recentWorkspaces, search]);

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
        className="eui-fullHeight"
        iconType="wsSelector"
        data-test-subj="empty-workspace-prompt"
        title={
          <EuiText size="m">
            <p>
              {i18n.translate('workspace.picker.empty.state.title', {
                defaultMessage: 'No workspace available',
              })}
            </p>
          </EuiText>
        }
        body={
          <EuiText size="s">
            <p>
              {isDashboardAdmin
                ? i18n.translate('workspace.picker.empty.state.description.admin', {
                    defaultMessage: 'Create a workspace to get start',
                  })
                : i18n.translate('workspace.picker.empty.state.description.noAdmin', {
                    defaultMessage:
                      'Contact your administrator to create a workspace or to be added to an existing one',
                  })}
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
            <EuiIcon
              size="s"
              type={useCase?.icon || 'wsSelector'}
              color={getValidWorkspaceColor(workspace.color)}
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
      <>
        <EuiTitle size="xxs">
          <h4>{itemType === 'all' ? allWorkspacesTitle : recentWorkspacesTitle}</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiListGroup showToolTips flush gutterSize="none" wrapText maxWidth={240}>
          {listItems}
        </EuiListGroup>
        <EuiSpacer size="s" />
      </>
    );
  };

  return (
    <>
      <EuiFieldSearch
        compressed={true}
        fullWidth={true}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchFieldPlaceholder}
      />
      <EuiSpacer />

      <EuiPanel
        paddingSize="none"
        color="transparent"
        hasBorder={false}
        className="eui-yScrollWithShadows"
      >
        {queriedRecentWorkspace.length > 0 &&
          getWorkspaceListGroup(queriedRecentWorkspace, 'recent')}

        {queriedWorkspace.length > 0 && getWorkspaceListGroup(queriedWorkspace, 'all')}

        {queriedWorkspace.length === 0 && getEmptyStatePrompt()}
      </EuiPanel>
    </>
  );
};
